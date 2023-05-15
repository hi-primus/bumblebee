// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentRef = Ref<any>;

interface ComponentRefs {
  [key: string]: ComponentRef;
}

const refs: ComponentRefs = {};

const getRef = (name: string): ComponentRef => {
  if (!refs[name]) {
    refs[name] = ref(null);
  }
  return refs[name];
};

export default function () {
  return {getRef, refs};
}
