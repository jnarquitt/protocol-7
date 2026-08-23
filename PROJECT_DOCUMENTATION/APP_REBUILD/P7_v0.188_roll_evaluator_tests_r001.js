/* Run with: node P7_v0.188_roll_evaluator_tests_r001.js */
const E=require('./P7_v0.188_roll_evaluator_r001.js');
const assert=require('assert');
const skills=[{id:'SKL-SIDEARMS',name:'Sidearms',category:'Combat',abilities:['DEX','DEX','WIS']}];
const conditions=[{id:'COND-SUPPRESSED',name:'Suppressed',effects:[{type:'IMPOSE_DISADVANTAGE',die:'d6',scope:['careful aim']}]},{id:'COND-STUNNED',name:'Stunned',effects:[{type:'REMOVE_REACTION'}]}];
const authorities={skills,conditions};
function base(overrides={}){return Object.assign({skill_id:'SKL-SIDEARMS',skill_ranks:3,ability_dice:{DEX:'d8',WIS:'d6'},gear_sources:[],vam_sources:[],advantage_sources:[],disadvantage_sources:[],mastery:{skill_mastered:false,access_granted:false},conditions:[]},overrides);}
assert.equal(E.skillDie(0),'d4'); assert.equal(E.skillDie(1),'d6'); assert.equal(E.skillDie(3),'d8'); assert.equal(E.skillDie(6),'d10'); assert.equal(E.skillDie(10),'d12'); assert.equal(E.skillDie(99),'d12');
let r=E.evaluate(base(),authorities); assert.equal(r.pool.length,4); assert.equal(r.skill.die,'d8'); assert.equal(r.ready_to_roll,true); assert.equal(r.grouped.ability.length,3);
r=E.evaluate(base({gear_sources:[{id:'GEAR-PISTOL',name:'Service Pistol',die:'d6',reason:'Primary relevant weapon'}]}),authorities); assert.equal(r.grouped.gear.length,1);
r=E.evaluate(base({vam_sources:[{id:'VAM-TEST',name:'Test VAM',die:'d4',operation:'ADD_DIE',reason:'Explicit VAM effect'}]}),authorities); assert.equal(r.grouped.vam.length,1); assert.equal(r.grouped.advantage,undefined);
r=E.evaluate(base({conditions:['COND-SUPPRESSED']}),authorities); assert.equal(r.grouped.disadvantage.length,1); assert.equal(r.grouped.disadvantage[0].die,'d6');
r=E.evaluate(base({advantage_sources:[{id:'ADV-HIGH-GROUND',die:'d4',reason:'Superior firing position'}],disadvantage_sources:[{id:'DIS-SMOKE',die:'d4',reason:'Heavy smoke'}]}),authorities); assert.equal(r.requires_gm_resolution,true); assert.equal(r.ready_to_roll,false);
r=E.evaluate(base({mastery:{skill_mastered:true,access_granted:true,source_id:'VAM-MASTERY-ACCESS'}}),authorities); assert.equal(r.grouped.mastery.length,1); assert.equal(r.grouped.mastery[0].die,'d8');
assert.throws(()=>E.evaluate(base({mastery:{skill_mastered:false,access_granted:true,source_id:'BAD'}}),authorities));
assert.throws(()=>E.evaluate(base({skill_id:'SKL-NOPE'}),authorities));
assert.throws(()=>E.evaluate(base({ability_dice:{DEX:'d20',WIS:'d6'}}),authorities));
console.log('PASS: Protocol 7 v0.188 roll evaluator regression suite');
