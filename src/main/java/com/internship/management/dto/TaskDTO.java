package com.internship.management.dto;

import com.internship.management.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private Long projectId;
    private String projectTitle;
    private Long internId;
    private String internName;

    public static TaskDTO fromEntity(Task task) {
        Long internId = null;
        String internName = null;

        if (task.getProject() != null && task.getProject().getInterns() != null
                && !task.getProject().getInterns().isEmpty()) {
            var intern = task.getProject().getInterns().get(0);
            internId = intern.getId();
            if (intern.getUser() != null) {
                internName = intern.getUser().getNom() + " " + intern.getUser().getPrenom();
            }
        }

        return TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .priority(task.getPriority() != null ? task.getPriority().name() : null)
                .dueDate(task.getDueDate())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .projectTitle(task.getProject() != null ? task.getProject().getTitle() : null)
                .internId(internId)
                .internName(internName)
                .build();
    }
}
