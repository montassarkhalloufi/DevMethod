import test from 'node:test';
import assert from 'node:assert/strict';
import {createTask,toggleTask,removeTask,restoreTask,filterTasks,decodeTasks,encodeTasks} from '../app/domain.mjs';
import {readTasks,writeTasks,STORAGE_KEY} from '../app/storage.mjs';
const a = createTask('Lire','Une note','a'), b = createTask('Marcher','','b');
test('creation trims inputs; rejects blank and over-limit values', () => {
  assert.deepEqual(createTask('  Titre  ',' Note ','id'),{id:'id',title:'Titre',note:'Note',done:false});
  for (const title of ['','   ','\n\t','x'.repeat(161)]) assert.throws(() => createTask(title,'','id'));
  assert.throws(() => createTask('Titre','x'.repeat(501),'id'));
  assert.equal(createTask('x'.repeat(160),'x'.repeat(500),'id').note.length,500);
});
test('toggle is immutable and filters preserve order', () => {
  const initial = [a,b], changed = toggleTask(initial,'a');
  assert.equal(a.done,false); assert.equal(changed[0].done,true);
  assert.deepEqual(filterTasks(changed,'done'),[changed[0]]); assert.deepEqual(filterTasks(changed,'active'),[b]);
  assert.deepEqual(filterTasks(changed,'all'),changed); assert.deepEqual(toggleTask(changed,'a'),initial);
});
test('delete and undo restore original position even after adding another task', () => {
  const initial=[a,b], {tasks,removed}=removeTask(initial,'a'), c=createTask('Écrire','','c');
  assert.deepEqual(tasks,[b]); assert.deepEqual(restoreTask([...tasks,c],removed),[a,b,c]);
  assert.deepEqual(restoreTask(initial,removed),initial); assert.equal(removeTask(initial,'missing').removed,null);
  assert.deepEqual(restoreTask([],null),[]);
});
test('empty persistence and Unicode round-trip; HTML remains literal text', () => {
  assert.deepEqual(decodeTasks(null),[]);
  const task=createTask('<img src=x onerror=alert(1)>','Été\n日本語','x');
  assert.deepEqual(decodeTasks(encodeTasks([task])),[task]);
});
test('untrusted storage schema rejects invalid data and duplicate IDs', () => {
  for(const raw of ['not JSON','null','{}','[]',JSON.stringify({version:2,tasks:[]}),JSON.stringify({version:1,tasks:[a,a]}),JSON.stringify({version:1,tasks:[{...a,done:'true'}]}),JSON.stringify({version:1,tasks:[{...a,title:' '}]}),JSON.stringify({version:1,tasks:[{...a,note:null}]})]) assert.throws(()=>decodeTasks(raw));
});
test('storage adapter uses versioned key; failures propagate rather than fake success', () => {
  const map=new Map(), storage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};
  writeTasks(storage,[a,b]); assert.ok(map.has(STORAGE_KEY)); assert.deepEqual(readTasks(storage),[a,b]);
  assert.throws(()=>writeTasks({setItem(){throw new Error('quota');}},[a]),/quota/);
  assert.throws(()=>readTasks({getItem(){throw new Error('blocked');}}),/blocked/);
});
