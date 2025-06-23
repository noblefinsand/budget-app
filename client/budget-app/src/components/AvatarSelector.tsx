import React from 'react';

export interface AvatarOption {
  id: string;
  emoji: string;
  name: string;
  bgColor: string;
}

const avatarOptions: AvatarOption[] = [
  { id: 'cat', emoji: '🐱', name: 'Cat', bgColor: 'bg-orange-500' },
  { id: 'dog', emoji: '🐕', name: 'Dog', bgColor: 'bg-amber-500' },
  { id: 'panda', emoji: '🐼', name: 'Panda', bgColor: 'bg-gray-500' },
  { id: 'fox', emoji: '🦊', name: 'Fox', bgColor: 'bg-orange-600' },
  { id: 'rabbit', emoji: '🐰', name: 'Rabbit', bgColor: 'bg-gray-400' },
  { id: 'bear', emoji: '🐻', name: 'Bear', bgColor: 'bg-brown-600' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', bgColor: 'bg-orange-700' },
  { id: 'lion', emoji: '🦁', name: 'Lion', bgColor: 'bg-yellow-600' },
  { id: 'elephant', emoji: '🐘', name: 'Elephant', bgColor: 'bg-gray-600' },
  { id: 'giraffe', emoji: '🦒', name: 'Giraffe', bgColor: 'bg-yellow-500' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', bgColor: 'bg-gray-700' },
  { id: 'owl', emoji: '🦉', name: 'Owl', bgColor: 'bg-amber-600' },
  { id: 'dolphin', emoji: '🐬', name: 'Dolphin', bgColor: 'bg-blue-500' },
  { id: 'whale', emoji: '🐋', name: 'Whale', bgColor: 'bg-blue-600' },
  { id: 'turtle', emoji: '🐢', name: 'Turtle', bgColor: 'bg-green-600' },
  { id: 'frog', emoji: '🐸', name: 'Frog', bgColor: 'bg-green-500' },
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly', bgColor: 'bg-purple-500' },
  { id: 'bee', emoji: '🐝', name: 'Bee', bgColor: 'bg-yellow-400' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', bgColor: 'bg-purple-400' },
  { id: 'dragon', emoji: '🐲', name: 'Dragon', bgColor: 'bg-red-600' },
  { id: 'dinosaur', emoji: '🦕', name: 'Dinosaur', bgColor: 'bg-green-700' },
  { id: 'monkey', emoji: '🐒', name: 'Monkey', bgColor: 'bg-amber-700' },
  { id: 'koala', emoji: '🐨', name: 'Koala', bgColor: 'bg-gray-500' },
  { id: 'sloth', emoji: '🦥', name: 'Sloth', bgColor: 'bg-green-800' },
];

interface AvatarSelectorProps {
  selectedAvatar: string;
  onAvatarSelect: (avatarId: string) => void;
}

export default function AvatarSelector({ selectedAvatar, onAvatarSelect }: AvatarSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Choose Your Avatar
      </label>
      <div className="grid grid-cols-6 gap-3">
        {avatarOptions.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onAvatarSelect(avatar.id)}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedAvatar === avatar.id
                ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800 scale-110'
                : 'hover:ring-2 hover:ring-gray-500'
            }`}
            style={{ backgroundColor: avatar.bgColor }}
            title={avatar.name}
          >
            {avatar.emoji}
          </button>
        ))}
      </div>
      {selectedAvatar && (
        <div className="text-sm text-gray-400 mt-2">
          Selected: {avatarOptions.find(a => a.id === selectedAvatar)?.name}
        </div>
      )}
    </div>
  );
}

export { avatarOptions }; 