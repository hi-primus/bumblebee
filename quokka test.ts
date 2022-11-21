import { BlurrClient } from './packages/blurr';

const client = BlurrClient()

const df = client.createDataframe({ dict: { a: [1, 2, 3], b: [4, 5, 6] }}).persist();