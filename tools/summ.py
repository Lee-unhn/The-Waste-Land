import json,sys
for line in sys.stdin:
  if not line.startswith('{'):print(line.strip());continue
  r=json.loads(line);print('RESULT',r['result'],'stage',r['stage'],'t',r['time'],'lv',r['lvl'],'kills',r['kills'],'evo',r['evo'][:3],'death',r.get('deathSrc'))
  for l in r['log']:
    if 'ev' in l:print(' ',l)
    elif l['t'] in (60,120,180,240):print('  s%d t%d lv%d hp%s en%d w=%s'%(l['s'],l['t'],l['lv'],l['hp'],l['en'],l['w']))
