import { Blurr } from './packages/blurr';

const client = Blurr()

const df = client.createDataframe({ dict: { a: [1, 2, 3], b: [4, 5, 6] }}).persist();