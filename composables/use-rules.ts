const ruleMethods = {
  required: (value: any) => !!value || 'This field is required'
};

type RuleKey = keyof typeof ruleMethods;

type RuleCallback = (value: any) => boolean | string;

export type Rule = RuleKey | RuleCallback;

export default function (rules: Rule[]) {
  return rules.map(rule =>
    typeof rule === 'string' ? ruleMethods[rule] : rule
  );
}
