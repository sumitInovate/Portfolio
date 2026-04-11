import { motion }  from 'framer-motion';
import { useUser } from '../../context/UserContext';

/**
 * CharacterAvatar — hexagonal portrait for the Hero section.
 * Reads avatarUrl and displayName from UserContext dynamically.
 */
export function CharacterAvatar() {
  const { userData } = useUser();
  const avatarUrl   = userData?.meta?.avatarUrl   ?? '/sumit_avatar.png';
  const displayName = userData?.meta?.displayName ?? 'HUNTER';
  const firstName   = displayName.split(' ')[0].toUpperCase();

  return (
    <div className="avatar-stage">
      {/* Outer hex glow ring */}
      <div className="avatar-hex-glow" />

      {/* The hexagon frame + portrait */}
      <motion.div
        className="avatar-hex-frame"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
      >
        {/* SVG hexagon clip and border */}
        <svg
          className="avatar-hex-svg"
          viewBox="0 0 200 230"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="hexClip">
              <polygon points="100,10 190,55 190,175 100,220 10,175 10,55" />
            </clipPath>
          </defs>
          {/* Background fill */}
          <polygon
            points="100,10 190,55 190,175 100,220 10,175 10,55"
            fill="rgba(13,21,46,0.92)"
          />
          {/* Portrait image — dynamic */}
          <image
            href={avatarUrl}
            x="10"
            y="10"
            width="180"
            height="210"
            clipPath="url(#hexClip)"
            preserveAspectRatio="xMidYMid slice"
          />
          {/* Hex border — drawn on top */}
          <polygon
            points="100,10 190,55 190,175 100,220 10,175 10,55"
            fill="none"
            stroke="rgba(100,140,255,0.55)"
            strokeWidth="2.5"
          />
          {/* Inner hex highlight */}
          <polygon
            points="100,18 182,60 182,170 100,212 18,170 18,60"
            fill="none"
            stroke="rgba(74,158,255,0.15)"
            strokeWidth="1"
          />
        </svg>
      </motion.div>

      {/* Label under avatar */}
      <div className="avatar-label">
        <span className="avatar-label-key">PLAYER:</span>
        <span className="avatar-label-val">{firstName}</span>
      </div>
    </div>
  );
}
