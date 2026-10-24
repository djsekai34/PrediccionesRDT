import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { headshotUrl } from '../lib/players';
import { fetchCoachPhoto } from '../lib/photos';

interface Props {
  name: string;
  id?: string; // id de ESPN del jugador
  coach?: boolean; // los entrenadores usan la foto de Wikipedia
  size?: number;
  className?: string;
}

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export function Avatar({ name, id, coach = false, size = 32, className }: Props) {
  const coachPhoto = useQuery({
    queryKey: ['coach-photo', name],
    queryFn: () => fetchCoachPhoto(name),
    enabled: coach && name.trim().length > 0,
    staleTime: Infinity,
    retry: 1,
  });
  const [failed, setFailed] = useState(false);

  const src = coach ? (coachPhoto.data ?? '') : id && !id.startsWith('coach-') ? headshotUrl(id) : '';

  useEffect(() => setFailed(false), [src]);

  const style = { width: size, height: size };

  if (!src || failed) {
    return (
      <span
        style={{ ...style, fontSize: size * 0.36 }}
        className={clsx(
          'grid shrink-0 place-items-center rounded-full bg-zinc-800 font-semibold text-zinc-400',
          className,
        )}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      style={style}
      className={clsx('shrink-0 rounded-full bg-zinc-800 object-cover object-top', className)}
      onError={() => setFailed(true)}
    />
  );
}
