import React, { useState, useEffect } from 'react';
import { Clock, FileText, CheckSquare, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { activityService, ActivityHistoryDTO } from '../../services/activityService';
import { userService } from '../../services/userService';
import ActivityModal from '../Modals/ActivityModal';

const activityIcons: Record<string, any> = {
  PROJECT: FileText,
  TASK: CheckSquare,
  INTERN: Users,
  USER: Users
};

const activityColors: Record<string, string> = {
  PROJECT: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  TASK: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
  INTERN: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
  USER: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'
};

interface ActivityWithUser extends ActivityHistoryDTO {
  userName?: string;
  userAvatar?: string;
}

export default function RecentActivity() {
  const { authUser } = useAuth();
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [authUser]);

  const loadActivities = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const recentActivities = await activityService.getRecentActivities();

      const activitiesWithUsers = await Promise.all(
        recentActivities.slice(0, 5).map(async (activity) => {
          try {
            const user = await userService.getUserById(activity.userId);
            return {
              ...activity,
              userName: `${user.prenom} ${user.nom}`,
              userAvatar: `https://ui-avatars.com/api/?name=${user.prenom}+${user.nom}&background=random`
            };
          } catch (error) {
            return {
              ...activity,
              userName: 'Utilisateur',
              userAvatar: 'https://ui-avatars.com/api/?name=User&background=random'
            };
          }
        })
      );

      setActivities(activitiesWithUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activité Récente</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Dernières actions du système</p>
          </div>
          <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.entityType || 'USER'] || FileText;
              const colorClass = activityColors[activity.entityType || 'USER'] || activityColors.USER;

              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <img
                    src={activity.userAvatar}
                    alt={activity.userName}
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {activity.userName}
                      </p>
                      <div className={`p-1 rounded-full ${colorClass}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => setShowAllActivities(true)}
          className="w-full mt-4 text-sm text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-300 transition-colors py-2"
        >
          Voir toutes les activités →
        </button>
      </div>

      <ActivityModal isOpen={showAllActivities} onClose={() => setShowAllActivities(false)} />
    </>
  );
}