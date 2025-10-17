import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { projectService } from '../../services/projectService';
import { internService } from '../../services/internService';

interface StatusData {
  name: string;
  value: number;
  color: string;
}

export default function ProjectStatusChart() {
  const { authUser } = useAuth();
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [authUser]);

  const loadChartData = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const userId = authUser.profile.userID;

      let projects;
      if (authUser.role === 'ADMIN') {
        projects = await projectService.getAllProjects();
      } else if (authUser.role === 'ENCADREUR') {
        projects = await projectService.getAllProjects({ encadreurId: userId });
      } else {
        const allInterns = await internService.getAllInterns();
        const allProjects = await projectService.getAllProjects();
        const currentIntern = allInterns.find(i => i.userId === userId);
        projects = allProjects.filter(p => p.stagiaireId === currentIntern?.id);
      }

      const statusMap = new Map<string, number>();
      projects.forEach(project => {
        statusMap.set(project.status, (statusMap.get(project.status) || 0) + 1);
      });

      const statusColors: Record<string, string> = {
        'PLANNING': '#94a3b8',
        'IN_PROGRESS': '#f97316',
        'COMPLETED': '#16a34a',
        'ON_HOLD': '#eab308',
        'CANCELLED': '#dc2626'
      };

      const statusLabels: Record<string, string> = {
        'PLANNING': 'Planification',
        'IN_PROGRESS': 'En cours',
        'COMPLETED': 'Terminé',
        'ON_HOLD': 'En pause',
        'CANCELLED': 'Annulé'
      };

      const chartData = Array.from(statusMap.entries()).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || '#6b7280'
      }));

      setData(chartData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomizedLabel = ({ name, value }: any) => {
    return `${name}: ${value}`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6 h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Répartition des Statuts de Projets</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {authUser?.role === 'ADMIN' ? 'État de tous les projets' : 'État de mes projets'}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Aucun projet disponible
        </div>
      ) : (
        <>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
