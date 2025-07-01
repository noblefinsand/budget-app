import { avatarOptions } from './AvatarSelector';

interface AvatarProps {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ avatarId, size = 'md', className = '' }: AvatarProps) {
  const avatar = avatarOptions.find(a => a.id === avatarId) || avatarOptions[0]; // fallback to cat
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl'
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center border-2 border-gray-300/20 shadow-sm ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: avatar.bgColor }}
      title={avatar.name}
    >
      {avatar.emoji}
    </div>
  );
} 