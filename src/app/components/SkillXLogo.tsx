import logoImage from "../../assets/routex-copy.png";

export function SkillXLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoImage}
      alt="SkillX - Master the Process"
      className={className}
    />
  );
}
