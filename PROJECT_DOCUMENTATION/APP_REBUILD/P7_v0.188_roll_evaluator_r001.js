/* Protocol 7 v0.188 deterministic roll evaluator r001
 * Pure JS module: no DOM and no storage dependencies.
 * Candidate implementation of P7_v0.188_ROLL_EVALUATOR_CONTRACT_r001.json.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.P7RollEvaluator=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VALID_DICE=new Set(['d4','d6','d8','d10','d12']);
  const SOURCE_TYPES=new Set(['skill','ability','gear','vam','advantage','disadvantage','mastery']);
  const SKILL_BREAKPOINTS=[[10,'d12'],[6,'d10'],[3,'d8'],[1,'d6'],[0,'d4']];
  function skillDie(ranks){
    if(!Number.isInteger(ranks)||ranks<0) throw new Error('skill_ranks must be an integer >= 0');
    return SKILL_BREAKPOINTS.find(([min])=>ranks>=min)[1];
  }
  function dieRecord(source_type,source_id,label,die,reason,mechanical_role){
    const r={source_type,source_id,label,die,reason,mechanical_role:mechanical_role||source_type};
    validateDieRecord(r); return r;
  }
  function validateDieRecord(r){
    if(!SOURCE_TYPES.has(r.source_type)) throw new Error('invalid source_type: '+r.source_type);
    if(!r.source_id||!r.reason) throw new Error('every die requires source_id and reason');
    if(!VALID_DICE.has(r.die)) throw new Error('invalid die: '+r.die);
    return true;
  }
  function normalizeSource(s,type,index){
    if(!s||typeof s!=='object') throw new Error(type+' source must be an object');
    const id=s.id||s.source_id||(type.toUpperCase()+'-'+(index+1));
    const die=s.die;
    if(!VALID_DICE.has(die)) throw new Error(type+' source '+id+' requires a valid die');
    return dieRecord(type,id,s.label||s.name||id,die,s.reason||s.effect||('Explicit '+type+' source'),s.mechanical_role||type);
  }
  function conditionEffects(conditionIds,conditionRegistry){
    const disadvantages=[],restrictions=[],warnings=[];
    for(const id of conditionIds||[]){
      const c=(conditionRegistry||[]).find(x=>x.id===id);
      if(!c){warnings.push('Unknown condition: '+id);continue;}
      for(const e of c.effects||[]){
        if(e.type==='IMPOSE_DISADVANTAGE'&&e.die){
          disadvantages.push({id:c.id,label:c.name+' Disadvantage',die:e.die,reason:c.name+': '+(Array.isArray(e.scope)?e.scope.join(', '):(e.scope||'condition effect'))});
        }else restrictions.push({condition_id:c.id,condition:c.name,effect:e});
      }
    }
    return {disadvantages,restrictions,warnings};
  }
  function evaluate(input,authorities){
    input=input||{}; authorities=authorities||{};
    const skills=authorities.skills||[];
    const skill=skills.find(s=>s.id===input.skill_id);
    if(!skill) throw new Error('unknown skill ID: '+input.skill_id);
    const pool=[],warnings=[],restrictions=[];
    const ranks=input.skill_ranks==null?0:input.skill_ranks;
    const sDie=skillDie(ranks);
    pool.push(dieRecord('skill',skill.id,skill.name+' Skill',sDie,skill.name+' at '+ranks+' rank'+(ranks===1?'':'s'),'ordinary skill die'));
    const abilityDice=input.ability_dice||{};
    (skill.abilities||[]).forEach((abilityId,i)=>{
      const die=abilityDice[abilityId];
      if(!VALID_DICE.has(die)) throw new Error('invalid or missing Ability die for '+abilityId);
      pool.push(dieRecord('ability','ABILITY-'+abilityId+'-'+(i+1),abilityId,die,skill.name+' uses '+abilityId+' as Ability die '+(i+1),'ability die'));
    });
    const gear=input.gear_sources||[];
    const relevantGear=gear.filter(g=>g&&g.relevant!==false);
    if(relevantGear.length>1&&!input.allow_multiple_gear) warnings.push('More than one relevant Gear die supplied; default primary Gear limit is one.');
    relevantGear.slice(0,input.allow_multiple_gear?relevantGear.length:1).forEach((g,i)=>pool.push(normalizeSource(g,'gear',i)));
    (input.vam_sources||[]).forEach((v,i)=>{ if(v.operation==='ADD_DIE'||v.die) pool.push(normalizeSource(v,'vam',i)); else restrictions.push({vam_id:v.id||v.source_id||('VAM-'+(i+1)),effect:v}); });
    const ce=conditionEffects(input.conditions,authorities.conditions); restrictions.push(...ce.restrictions); warnings.push(...ce.warnings);
    const adv=(input.advantage_sources||[]).map((s,i)=>normalizeSource(s,'advantage',i));
    const dis=[...(input.disadvantage_sources||[]),...ce.disadvantages].map((s,i)=>normalizeSource(s,'disadvantage',i));
    pool.push(...adv,...dis);
    let requiresGM=false;
    if(adv.length+dis.length>1){ requiresGM=true; warnings.push('Multiple Advantage/Disadvantage sources are present. Interaction is unresolved; GM resolution required before rolling.'); }
    const mastery=input.mastery||{};
    if(mastery.access_granted&&!mastery.skill_mastered) throw new Error('Mastery access cannot be granted for an unmastered Skill');
    if(mastery.skill_mastered&&mastery.access_granted){
      if(!mastery.source_id) throw new Error('Mastery requires an explicit access source');
      pool.push(dieRecord('mastery',mastery.source_id,skill.name+' Mastery',sDie,'Explicit Mastery access for mastered '+skill.name,'mastery die'));
    }
    pool.forEach(validateDieRecord);
    const grouped={}; for(const r of pool)(grouped[r.source_type]||(grouped[r.source_type]=[])).push(r);
    return {skill:{id:skill.id,name:skill.name,ranks,die:sDie},pool,grouped,restrictions,warnings,requires_gm_resolution:requiresGM,ready_to_roll:!requiresGM,explanation:pool.map(r=>r.label+' '+r.die+' — '+r.reason).join('\n')};
  }
  return {evaluate,skillDie,validateDieRecord,VALID_DICE:Array.from(VALID_DICE)};
});
