UPDATE task_models SET progress = 'not_started' WHERE progress IN ('notStarted', 'not started', 'NotStarted');
UPDATE task_models SET progress = 'in_progress' WHERE progress IN ('inProgress', 'in progress', 'InProgress');
UPDATE task_models SET progress = 'done' WHERE progress IN ('Done', 'DONE', 'completed');
