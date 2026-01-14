export const UseCaseElementType = {
  UseCase: 'UseCase',
  UseCaseActor: 'UseCaseActor',
  UseCaseSystem: 'UseCaseSystem',
  UseCaseExternalSystem: 'UseCaseExternalSystem',
} as const;

export const UseCaseRelationshipType = {
  UseCaseAssociation: 'UseCaseAssociation',
  UseCaseGeneralization: 'UseCaseGeneralization',
  UseCaseInclude: 'UseCaseInclude',
  UseCaseExtend: 'UseCaseExtend',
} as const;
