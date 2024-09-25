import Benchmark from 'benchmark';
import { BPE as BPE1 } from './old/bpe-1.js'
import { BPE as BPECur } from './src/bpe.js'
import { readFileSync } from 'node:fs';
var suite = new Benchmark.Suite;
const bpe1 = new BPE1("bpe1")
const bpecur = new BPECur('bpe');
const corpus = readFileSync('moby.txt', { encoding: 'utf8'})
// add tests
suite.add('bpe-1#train', function() {
    bpe1.train(corpus, false, 500)
})
.add('bpe-cur#train', function() {
    bpecur.train(corpus, false, 500)
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
}).run()
