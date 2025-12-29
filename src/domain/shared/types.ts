import { registerEnumType } from 'type-graphql';

export enum QuestionnaireProgressStatus {
  IN_PROGRESS = 'in_progress',
  READY_TO_SUBMIT = 'ready_to_submit',
  SUBMITTED = 'submitted',
}

registerEnumType(QuestionnaireProgressStatus, {
  name: 'QuestionnaireProgressStatus',
});
