import { UseCaseRelationshipType } from '..';
import { UMLRelationship } from '../../../services/uml-relationship/uml-relationship';

export class UMLUseCaseSupport extends UMLRelationship {
    static features = { ...UMLRelationship.features, straight: true };

    type = UseCaseRelationshipType.UseCaseSupport;
}
