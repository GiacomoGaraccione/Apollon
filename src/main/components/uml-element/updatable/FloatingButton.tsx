import React from 'react';
import { styled } from '../../theme/styles';

const FloatingButtonContainer = styled.g.attrs((props) => ({
  ...props,
}))`
  transition: all 180ms ease-in-out;
  pointer-events: all;

  path {
    pointer-events: all;
    fill: var(--apollon-primary-contrast, #212529);
  }
  rect {
    pointer-events: all;
    fill: var(--apollon-background, #ffffff);
    stroke: var(--apollon-gray, #e9ecef);
  }
  :hover {
    transform: translate(0px, -30px);
  }
  :active {
    transform: translate(0px, -30px);
  }
  :hover rect {
    fill: var(--apollon-gray, #e9ecef);
    stroke: var(--apollon-gray-variant, #343a40);
  }
  :active rect {
    fill: var(--apollon-gray, #e9ecef);
    stroke: var(--apollon-gray-variant, #343a40);
  }
`;

export interface FloatingButtonProps {
  style?: React.CSSProperties | undefined;
  children?: React.ReactNode;
  onClick?: () => void;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ children, ...props }) => {
  return (
    <FloatingButtonContainer {...props}>
      <rect height={30} width={30} rx="0.25rem" ry="0.25rem" />
      {children}
    </FloatingButtonContainer>
  );
};
