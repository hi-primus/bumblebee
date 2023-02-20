const ruleMethods = {
  required: (value: any) => !!value || 'Required.',
};

export type RuleKey = keyof typeof ruleMethods

export default function (rules: RuleKey[]) {
  return rules.map(rule => ruleMethods[rule]);
}
