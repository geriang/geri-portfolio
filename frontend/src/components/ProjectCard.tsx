import React from 'react';

type ToolData = unknown; // Replace with proper type when defined

interface ProjectCardProps {
  tool: ToolData;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ tool }) => {
  // Simple rendering of JSON data; can be styled later
  return (
    <div className="border rounded p-4 my-2 bg-gray-50 dark:bg-gray-800" data-testid="project-card">
      <pre className="whitespace-pre-wrap">{JSON.stringify(tool, null, 2)}</pre>
    </div>
  );
};

export default ProjectCard;
