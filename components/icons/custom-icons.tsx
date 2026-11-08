import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string;
  strokeWidth?: number | string;
}

function Outline({ size = 24, strokeWidth = 1.75, children, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Steering wheel (outline). */
export function SteeringWheelIcon(props: IconProps) {
  return (
    <Outline {...props}>
      <circle cx="12" cy="12" r="9.25" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M2.9 10.6c2.6.4 5.2.5 6.9 1.2M21.1 10.6c-2.6.4-5.2.5-6.9 1.2M12 14.4V21" />
    </Outline>
  );
}

/** Road in perspective with dashed centre line (outline). */
export function RoadIcon(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M8.6 3 4 21M15.4 3 20 21" />
      <path d="M12 4v2.4M12 9.5v3M12 16.5v4" />
    </Outline>
  );
}

/** Speech bubble with a star inside (outline) — "Share your experience". */
export function ReviewBubbleIcon(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M4.5 3.5h15a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5H11l-5 3.8v-3.8H4.5A2.5 2.5 0 0 1 2 15V6a2.5 2.5 0 0 1 2.5-2.5Z" />
      <path d="m12 6.2 1.3 2.7 3 .4-2.2 2.1.6 3L12 12.9 9.3 14.4l.6-3-2.2-2.1 3-.4Z" />
    </Outline>
  );
}

/** Filled seal used for the "Govt. of Odisha" badge. Colours come from CSS (currentColor + accent). */
export function OdishaEmblemIcon({ size = 36, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      {...rest}
    >
      <circle cx="24" cy="24" r="22" fill="#C62828" />
      <circle cx="24" cy="24" r="18.5" fill="#FFF4EA" />
      <circle cx="24" cy="24" r="13" fill="none" stroke="#C62828" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="3" fill="#C62828" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <line
            key={i}
            x1={24 + Math.cos(a) * 4.5}
            y1={24 + Math.sin(a) * 4.5}
            x2={24 + Math.cos(a) * 12.2}
            y2={24 + Math.sin(a) * 12.2}
            stroke="#C62828"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/* ---- Brand icons (lucide v1 no longer ships brand logos) ---- */

export function YoutubeIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}

export function FacebookIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2ZM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0Zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9Z" />
    </svg>
  );
}

export function WhatsappIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1.1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.800-.7 2-1.4.3-.7.3-1.300.2-1.400-.1-.1-.3-.2-.6-.3ZM12 21.800a9.800 9.800 0 0 1-5-1.400l-.4-.2-3.700 1 1-3.600-.2-.4A9.800 9.800 0 1 1 12 21.800ZM12 0A12 12 0 0 0 1.600 17.900L0 24l6.300-1.600A12 12 0 1 0 12 0Z" />
    </svg>
  );
}
