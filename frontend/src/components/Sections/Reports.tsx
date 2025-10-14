import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { internService, InternDTO } from '../../services/internService';
import { projectService, ProjectDTO } from '../../services/projectService';
import { taskService, TaskDTO } from '../../services/taskService';
import { generatePDF } from '../../utils/pdfGenerator';
import { useApiError } from '../../hooks/useApiError';

export default function Reports() {
  const { authUser } = useAuth();
  const { handleApiError } = useApiError();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);

  useEffect(() => {
    loadReportData();
  }, [authUser]);

  const loadReportData = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const userId = authUser.profile.userID;

      if (authUser.role === 'ADMIN') {
        const [internsData, projectsData, tasksData] = await Promise.all([
          internService.getAllInterns(),
          projectService.getAllProjects(),
          taskService.getAllTasks()
        ]);
        setInterns(internsData);
        setProjects(projectsData);
        setTasks(tasksData);

      } else if (authUser.role === 'ENCADREUR') {
        const [internsData, projectsData, tasksData] = await Promise.all([
          internService.getAllInterns({ encadreurUserId: userId }),
          projectService.getAllProjects({ encadreurId: userId }),
          taskService.getAllTasks()
        ]);

        const internIds = internsData.map(i => i.userId);
        const filteredTasks = tasksData.filter(t => internIds.includes(t.assignedTo));

        setInterns(internsData);
        setProjects(projectsData);
        setTasks(filteredTasks);

      } else if (authUser.role === 'STAGIAIRE') {
        const [allInterns, allProjects, tasksData] = await Promise.all([
          internService.getAllInterns(),
          projectService.getAllProjects(),
          taskService.getAllTasks({ userId })
        ]);

        const currentIntern = allInterns.find(i => i.userId === userId);
        const myProjects = allProjects.filter(p => p.stagiaireId === currentIntern?.id);

        setInterns(currentIntern ? [currentIntern] : []);
        setProjects(myProjects);
        setTasks(tasksData);
      }
    } catch (error: any) {
      handleApiError(error, 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const generateGlobalReport = () => {
    if (!authUser) return;

    try {
      setGeneratingReport(true);

      const userName = `${authUser.profile.firstName} ${authUser.profile.lastName}`;

      generatePDF({
        interns,
        projects,
        tasks,
        userRole: authUser.role,
        userName
      });

      setTimeout(() => {
        setGeneratingReport(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      setGeneratingReport(false);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const successRate = projects.length > 0
    ? Math.round((completedProjects / projects.length) * 100)
    : 0;
  const taskCompletionRate = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-0">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Générer des rapports PDF complets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{successRate}%</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Taux de Réussite</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{projects.length}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Projets</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tasks.length}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Tâches</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{taskCompletionRate}%</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tâches Terminées</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Rapport Global</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Générer un rapport PDF complet avec toutes les données
              </p>
            </div>
            <button
              onClick={generateGlobalReport}
              disabled={generatingReport || loading}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Générer Rapport PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Contenu du Rapport</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Résumé global des données
                </li>
                {(authUser?.role === 'ADMIN' || authUser?.role === 'ENCADREUR') && (
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Détails par stagiaire
                  </li>
                )}
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Détails par projet
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Statistiques des tâches
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Taux de réussite et conclusion
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Données Incluses</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {(authUser?.role === 'ADMIN' || authUser?.role === 'ENCADREUR') && (
                  <li className="flex items-center justify-between">
                    <span>Stagiaires</span>
                    <span className="font-semibold">{interns.length}</span>
                  </li>
                )}
                <li className="flex items-center justify-between">
                  <span>Projets</span>
                  <span className="font-semibold">{projects.length}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Tâches</span>
                  <span className="font-semibold">{tasks.length}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Taux de réussite</span>
                  <span className="font-semibold">{successRate}%</span>
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Informations</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Format: PDF
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Téléchargement automatique
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Données en temps réel
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Personnalisé par rôle
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}