import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {batch} from '../src/art.js';
test('static batching accepts mixed indexed and non-indexed primitives',()=>{
  const root=new T.Group(),mat=new T.MeshStandardMaterial();
  const a=new T.Mesh(new RoundedBoxGeometry(1,1,1,2,.09),mat);
  const b=new T.Mesh(new T.CylinderGeometry(1,1,1,12),mat);b.position.x=3;
  root.add(a,b);batch(root);
  assert.equal(root.children.length,1);
  const g=root.children[0].geometry;g.computeBoundingBox();
  assert.ok(g.attributes.position.count>100);
  assert.equal(g.boundingBox.max.x,4);
  assert.ok(g.boundingBox.min.x<=-.49);
});
