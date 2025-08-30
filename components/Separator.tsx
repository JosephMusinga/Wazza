import styles from './Separator.module.css';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = ({ 
  className, 
  orientation = 'horizontal',
  ...props 
}: SeparatorProps) => {
  return (
    <div
      className={`${styles.separator} ${styles[orientation]} ${className || ''}`}
      {...props}
    />
  );
};