import jsPDF from 'jspdf';
import { InternDTO } from '../services/internService';
import { ProjectDTO } from '../services/projectService';
import { TaskDTO } from '../services/taskService';

interface ReportData {
  interns: InternDTO[];
  projects: ProjectDTO[];
  tasks: TaskDTO[];
  userRole: 'ADMIN' | 'ENCADREUR' | 'STAGIAIRE';
  userName: string;
}

export const generatePDF = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  const addText = (text: string, x: number, size: number = 12, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.text(text, x, yPosition);
    yPosition += size / 2 + 2;
  };

  const addLine = () => {
    yPosition += 3;
    doc.setDrawColor(230, 230, 230);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;
  };

  const checkPageBreak = (spaceNeeded: number = 20) => {
    if (yPosition + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.line(20, 10, pageWidth - 20, 10);

  addText('RAPPORT DE GESTION DES STAGES', 20, 18, 'bold');
  addText(`Genere le: ${new Date().toLocaleString('fr-FR')}`, 20, 10);
  addText(`Par: ${data.userName} (${data.userRole})`, 20, 10);
  addLine();

  checkPageBreak(30);
  addText('RESUME GLOBAL', 20, 14, 'bold');
  yPosition += 3;

  const activeProjects = data.projects.filter(p => p.status === 'IN_PROGRESS').length;
  const completedProjects = data.projects.filter(p => p.status === 'COMPLETED').length;
  const completedTasks = data.tasks.filter(t => t.status === 'DONE').length;
  const successRate = data.projects.length > 0
    ? Math.round((completedProjects / data.projects.length) * 100)
    : 0;

  if (data.userRole === 'ADMIN' || data.userRole === 'ENCADREUR') {
    addText(`Nombre de stagiaires: ${data.interns.length}`, 25, 11);
  }
  addText(`Projets actifs: ${activeProjects}`, 25, 11);
  addText(`Projets termines: ${completedProjects}`, 25, 11);
  addText(`Total projets: ${data.projects.length}`, 25, 11);
  addText(`Taches terminees: ${completedTasks}`, 25, 11);
  addText(`Total taches: ${data.tasks.length}`, 25, 11);
  addText(`Taux de reussite: ${successRate}%`, 25, 11);

  addLine();

  if (data.userRole === 'ADMIN' || data.userRole === 'ENCADREUR') {
    checkPageBreak(40);
    addText('DETAILS PAR STAGIAIRE', 20, 14, 'bold');
    yPosition += 3;

    data.interns.forEach((intern, index) => {
      checkPageBreak(35);

      addText(`${index + 1}. ${intern.firstName} ${intern.lastName}`, 25, 11, 'bold');
      addText(`Email: ${intern.email}`, 30, 10);
      addText(`Departement: ${intern.department}`, 30, 10);
      addText(`Statut: ${intern.status}`, 30, 10);

      const internProjects = data.projects.filter(p => p.stagiaireId === intern.id);
      const internTasks = data.tasks.filter(t => t.assignedTo === intern.userId);
      const internCompletedTasks = internTasks.filter(t => t.status === 'DONE').length;

      addText(`Projets assignes: ${internProjects.length}`, 30, 10);
      addText(`Taches assignees: ${internTasks.length}`, 30, 10);
      addText(`Taches terminees: ${internCompletedTasks}`, 30, 10);

      if (internTasks.length > 0) {
        const taskCompletion = Math.round((internCompletedTasks / internTasks.length) * 100);
        addText(`Taux de completion: ${taskCompletion}%`, 30, 10);
      }

      yPosition += 3;
    });

    addLine();
  }

  checkPageBreak(40);
  addText('DETAILS PAR PROJET', 20, 14, 'bold');
  yPosition += 3;

  data.projects.forEach((project, index) => {
    checkPageBreak(40);

    addText(`${index + 1}. ${project.title}`, 25, 11, 'bold');
    addText(`Description: ${project.description.substring(0, 80)}${project.description.length > 80 ? '...' : ''}`, 30, 9);

    const statusLabels = {
      'PLANNING': 'Planification',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Termine',
      'ON_HOLD': 'En pause',
      'CANCELLED': 'Annule'
    };
    addText(`Statut: ${statusLabels[project.status]}`, 30, 10);
    addText(`Progression: ${project.progress}%`, 30, 10);
    addText(`Departement: ${project.department}`, 30, 10);
    addText(`Date debut: ${new Date(project.startDate).toLocaleDateString('fr-FR')}`, 30, 10);
    addText(`Date fin: ${new Date(project.endDate).toLocaleDateString('fr-FR')}`, 30, 10);

    const projectTasks = data.tasks.filter(t => t.projectId === project.id);
    const projectCompletedTasks = projectTasks.filter(t => t.status === 'DONE').length;
    const projectInProgressTasks = projectTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const projectPendingTasks = projectTasks.filter(t => t.status === 'TODO').length;

    addText(`Taches totales: ${projectTasks.length}`, 30, 10);
    addText(`Taches terminees: ${projectCompletedTasks}`, 30, 10);
    addText(`Taches en cours: ${projectInProgressTasks}`, 30, 10);
    addText(`Taches en attente: ${projectPendingTasks}`, 30, 10);

    yPosition += 3;
  });

  addLine();
  checkPageBreak(30);
  addText('STATISTIQUES DES TACHES', 20, 14, 'bold');
  yPosition += 3;

  const tasksByStatus = {
    TODO: data.tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: data.tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: data.tasks.filter(t => t.status === 'DONE').length,
    BUG: data.tasks.filter(t => t.status === 'BUG').length
  };

  const tasksByPriority = {
    LOW: data.tasks.filter(t => t.priority === 'LOW').length,
    MEDIUM: data.tasks.filter(t => t.priority === 'MEDIUM').length,
    HIGH: data.tasks.filter(t => t.priority === 'HIGH').length
  };

  addText('Par statut:', 25, 11, 'bold');
  addText(`En attente: ${tasksByStatus.TODO}`, 30, 10);
  addText(`En cours: ${tasksByStatus.IN_PROGRESS}`, 30, 10);
  addText(`Terminees: ${tasksByStatus.DONE}`, 30, 10);
  addText(`Bugs: ${tasksByStatus.BUG}`, 30, 10);

  yPosition += 3;
  addText('Par priorite:', 25, 11, 'bold');
  addText(`Basse: ${tasksByPriority.LOW}`, 30, 10);
  addText(`Moyenne: ${tasksByPriority.MEDIUM}`, 30, 10);
  addText(`Haute: ${tasksByPriority.HIGH}`, 30, 10);

  addLine();
  checkPageBreak(25);
  addText('CONCLUSION', 20, 14, 'bold');
  yPosition += 3;

  const taskCompletionRate = data.tasks.length > 0
    ? Math.round((completedTasks / data.tasks.length) * 100)
    : 0;

  addText(`Taux de completion global des taches: ${taskCompletionRate}%`, 25, 11);
  addText(`Taux de reussite des projets: ${successRate}%`, 25, 11);

  let performance = 'Excellente';
  if (successRate < 50) performance = 'A ameliorer';
  else if (successRate < 70) performance = 'Moyenne';
  else if (successRate < 85) performance = 'Bonne';

  addText(`Evaluation de la performance: ${performance}`, 25, 11);

  yPosition += 5;
  doc.setDrawColor(249, 115, 22);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  const fileName = `Rapport_${data.userRole}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
