type IconProps = {
  className?: string;
};

function IconBase({
  children,
  className = "h-5 w-5",
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 13h6V4H4v9Z" />
      <path d="M14 20h6V4h-6v16Z" />
      <path d="M4 20h6v-3H4v3Z" />
    </IconBase>
  );
}

export function PipelineIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </IconBase>
  );
}

export function ProjectsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M8 5V3.5" />
      <path d="M16 5V3.5" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </IconBase>
  );
}

export function LeadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </IconBase>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.5 4.5 9 4l1.5 4-1.8 1.2a10.7 10.7 0 0 0 6.1 6.1l1.2-1.8 4 1.5-.5 2.5c-.2 1-1.1 1.7-2.1 1.5C10.6 17.9 6.1 13.4 5 6.6c-.2-1 .5-1.9 1.5-2.1Z" />
    </IconBase>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6.5h16v11H4v-11Z" />
      <path d="m5 8 7 5 7-5" />
    </IconBase>
  );
}

export function CommunicationIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v5A2.5 2.5 0 0 1 17.5 14H10l-4.5 4v-4A2.5 2.5 0 0 1 4 11.5v-5Z" />
      <path d="M8 8.5h8" />
      <path d="M8 11h5" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m20 20-4.2-4.2" />
      <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
    </IconBase>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M17 10.5a3 3 0 1 0 0-6" />
      <path d="M16.5 15a4.5 4.5 0 0 1 4 4.5" />
    </IconBase>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </IconBase>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5.5 5.5v5.8c0 4.2 2.6 7.4 6.5 9.7 3.9-2.3 6.5-5.5 6.5-9.7V5.5L12 3Z" />
      <path d="m9.5 12 1.7 1.7 3.5-4" />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v12A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5v-12Z" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M5 9h14" />
      <path d="M8.5 13h3" />
      <path d="M8.5 16h6" />
    </IconBase>
  );
}
