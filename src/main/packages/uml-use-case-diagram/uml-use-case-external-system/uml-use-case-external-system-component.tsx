import React, { FunctionComponent } from 'react';
import { Text } from '../../../components/controls/text/text';
import { UMLUseCaseExternalSystem } from './uml-use-case-external-system';
import { ThemedRect } from '../../../components/theme/themedComponents';

export const UMLUseCaseExternalSystemComponent: FunctionComponent<Props> = ({ element, children, fillColor }) => (
    <g>
        <ThemedRect
            width="100%"
            height="100%"
            fillColor={fillColor || element.fillColor}
            strokeColor={element.strokeColor}
        />
        <Text fill={element.textColor} y={16}>
            {element.name}
        </Text>
        {children}
    </g>
);

interface Props {
    element: UMLUseCaseExternalSystem;
    fillColor?: string;
    children?: React.ReactNode;
}
