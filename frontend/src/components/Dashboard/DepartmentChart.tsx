import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { internService } from '../../services/internService';
import { projectService } from '../../services/projectService';

interface DepartmentData {
  department: string;
  count: number;
  color?: string;
}

const COLORS = ['#f97316', '#fb923c', '#ef4444', '#dc2626', '#ea580c', '#f59e0b'];

export default function DepartmentChart() {
  const { authUser } = useAuth();
  const [data, setData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [authUser]);

  const loadChartData = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const userId = authUser.profile.userID;

      if (authUser.role === 'ADMIN') {
        const interns = await internService.getAllInterns();
        const deptMap = new Map<string, number>();

        interns.forEach(intern => {
          const dept = intern.department || 'Non défini';
          deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
        });

        const chartData = Array.from(deptMap.entries())
          .map(([department, count]) => ({ department, count }))
          .sort((a, b) => b.count - a.count);

        setData(chartData);

      } else if (authUser.role === 'ENCADREUR') {
        const projects = await projectService.getAllProjects({ encadreurId: userId });
        const statusMap = new Map<string, number>();

        projects.forEach(project => {
          statusMap.set(project.status, (statusMap.get(project.status) || 0) + 1);
        });

        const statusLabels: Record<string, string> = {
          'PLANNING': 'Planification',
          'IN_PROGRESS': 'En cours',
          'COMPLETED': 'Terminé',
          'ON_HOLD': 'En pause',
          'CANCELLED': 'Annulé'
        };

        const chartData = Array.from(statusMap.entries())
          .map(([status, count]) => ({
            department: statusLabels[status] || status,
            count,
            color: status === 'IN_PROGRESS' ? '#f97316' : status === 'COMPLETED' ? '#16a34a' : '#6b7280'
          }));

        setData(chartData);

      } else if (authUser.role === 'STAGIAIRE') {
        const [allInterns, projects] = await Promise.all([
          internService.getAllInterns(),
          projectService.getAllProjects()
        ]);

        const currentIntern = allInterns.find(i => i.userId === userId);
        const myProjects = projects.filter(p => p.stagiaireId === currentIntern?.id);

        const chartData = myProjects.map(project => ({
          department: project.title.length > 20 ? project.title.substring(0, 20) + '...' : project.title,
          count: project.progress
        }));

        setData(chartData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6 h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getTitle = () => {
    if (authUser?.role === 'ADMIN') return 'Stagiaires par Département';
    if (authUser?.role === 'ENCADREUR') return 'Mes Projets par Statut';
    return 'Progression de Mes Projets';
  };

  const getDescription = () => {
    if (authUser?.role === 'ADMIN') return 'Répartition entre les différents départements';
    if (authUser?.role === 'ENCADREUR') return 'Distribution de mes projets';
    return 'Avancement de chaque projet';
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getTitle()}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{getDescription()}</p>
      </div>

      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Aucune donnée disponible
        </div>
      ) : authUser?.role === 'ENCADREUR' && data.length <= 5 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ department, count }) => `${department}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="department"
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar
                dataKey="count"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                name={authUser?.role === 'STAGIAIRE' ? 'Progression (%)' : authUser?.role === 'ENCADREUR' ? 'Projets' : 'Stagiaires'}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}