interface Source {
  name: string;
  client: Client;
  _blurrMember: 'source';
  toString: () => string;
}
