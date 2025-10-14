import React, { useState, useEffect } from 'react';
import { Users, FolderOpen, CheckSquare, TrendingUp } from 'lucide-react';
import MetricCard from './MetricCard';
import ProgressChart from './ProgressChart';
import ProjectStatusChart from './ProjectStatusChart';
import DepartmentChart from './DepartmentChart';
import RecentActivity from './RecentActivity';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { InternDTO, internService } from '../../services/internService';
import { useApiError } from '../../hooks/useApiError';

export default function Dashboard() {
  const { authUser } = useAuth();
  const { handleApiError } = useApiError();

  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [filteredInterns, setFilteredInterns] = useState<InternDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    totalInterns: 0,
    activeProjects: 0,
    completedTasks: 0,
    successRate: 0,
  });

  // Chargement des stagiaires selon le rôle
  useEffect(() => {
    loadInterns();
  }, [authUser]);

  const loadInterns = async () => {
    try {
      setLoading(true);
      let data: InternDTO[];

      if (authUser?.role === 'ADMIN') {
        data = await internService.getAllInterns();
      } else if (authUser?.role === 'ENCADREUR') {
        const userId = authUser.profile.userID;
        data = await internService.getAllInterns({ encadreurUserId: userId });
      } else {
        data = [];
      }

      setInterns(data);
      setFilteredInterns(data);

      setMetrics((prev) => ({
        ...prev,
        totalInterns: data.length,
      }));
    } catch (error: any) {
      handleApiError(error, 'Erreur lors du chargement des stagiaires');
    } finally {
      setLoading(false);
    }
  };

  // Chargement des autres métriques du dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardMetrics();
      setMetrics((prev) => ({
        ...prev,
        activeProjects: data.activeProjects || 0,
        completedTasks: data.completedTasks || 0,
        successRate: 85, // Valeur statique pour l'instant
      }));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Message de bienvenue
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Bonjour'
      : currentHour < 18
      ? 'Bon après-midi'
      : 'Bonsoir';
  const userRole = authUser?.role || 'STAGIAIRE';
  const userName = authUser
    ? `${authUser.profile.firstName} ${authUser.profile.lastName}`
    : 'Utilisateur';

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Responsable RH';
      case 'ENCADREUR':
        return 'Encadreur';
      case 'STAGIAIRE':
        return 'Stagiaire';
      default:
        return 'Utilisateur';
    }
  };

  // Loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-sm p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {greeting}, {userName}
            </h2>
            <p className="text-orange-50 text-sm md:text-base">
              {userRole === 'ADMIN' &&
                "Bienvenue sur votre tableau de bord. Voici un aperçu de vos activités aujourd'hui."}
              {userRole === 'ENCADREUR' &&
                'Gérez vos stagiaires et suivez leurs progressions.'}
              {userRole === 'STAGIAIRE' &&
                'Consultez vos projets et suivez vos progressions.'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
              <p className="text-xs md:text-sm text-orange-100 mb-1">
                Aujourd'hui
              </p>
              <p className="text-xl md:text-2xl font-bold">
                {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Stagiaires"
          value={metrics.totalInterns}
          icon={Users}
          color="bg-blue-500"
          trend={{ value: 0, isPositive: true }}
        />
        <MetricCard
          title="Projets Actifs"
          value={metrics.activeProjects}
          icon={FolderOpen}
          color="bg-green-500"
          trend={{ value: 0, isPositive: true }}
        />
        <MetricCard
          title="Tâches Terminées"
          value={metrics.completedTasks}
          icon={CheckSquare}
          color="bg-purple-500"
          trend={{ value: 0, isPositive: true }}
        />
        <MetricCard
          title="Taux de Réussite"
          value={`${metrics.successRate}%`}
          icon={TrendingUp}
          color="bg-orange-500"
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart />
        <ProjectStatusChart />
      </div>

      {/* Diagramme et activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DepartmentChart />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
