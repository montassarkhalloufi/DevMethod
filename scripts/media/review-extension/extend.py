"""Insert real review screenshots into the existing 0.3.0 film; never rebuild its story.
Requires ffmpeg, ffprobe, macOS say/Thomas and Pillow. Run from repository root.
"""
import json, math, pathlib, subprocess, re, hashlib
from PIL import Image, ImageDraw, ImageFont
ROOT=pathlib.Path.cwd(); TEMP=pathlib.Path('/private/tmp/devmethod-review-film'); TEMP.mkdir(exist_ok=True)
MEDIA=ROOT/'docs/media/visual-chain'; EXT=ROOT/'docs/media/review-extension'
MOVIE='docs/media/visual-chain/devmethod-du-besoin-au-produit-4k.fr.mp4'
CUT=171.52

def run(args):
    subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=open(TEMP/'encode.log','a'))
def duration(file):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(file)]))
def font(size,serif=False,mono=False):
    return ImageFont.truetype('/System/Library/Fonts/Menlo.ttc' if mono else '/System/Library/Fonts/Supplemental/'+('Georgia.ttf' if serif else 'Arial.ttf'),size)
def wrap(draw,text,f,width):
    lines=[]; line=''
    for word in text.split():
        candidate=(line+' '+word).strip()
        if draw.textlength(candidate,font=f)>width and line: lines.append(line);line=word
        else:line=candidate
    return lines+[line]
def frame(i,s):
    im=Image.new('RGB',(3840,2160),'#0e1d21'); d=ImageDraw.Draw(im)
    d.text((160,76),'DevMethod / Review',font=font(40),fill='#b0c6bf')
    d.text((3020,76),f'COMPLÉMENT  {i+1:02} / 06',font=font(32),fill='#b0c6bf')
    d.text((160,210),s['title'],font=font(110,True),fill='#f6f0e5')
    d.rounded_rectangle((160,440,1220,1850),radius=28,fill='#183137',outline='#45625f',width=2)
    y=510
    d.text((210,y),'DEPUIS LE PACKAGE NPM',font=font(30),fill='#e9ae82'); y+=95
    for line in s['command'].split('\n'):
        d.text((210,y),line,font=font(34,mono=True),fill='#f1b98e');y+=58
    y+=90
    for line in wrap(d,s['explanation'],font(49),950):
        d.text((210,y),line,font=font(49),fill='#ecf1e8');y+=68
    y+=75
    for line in wrap(d,s['note'],font(33),950):
        d.text((210,y),line,font=font(33),fill='#b5d0c2');y+=48
    shot=Image.open(EXT/'captures'/s['capture']).convert('RGB');scale=min(2360/shot.width,1470/shot.height);shot=shot.resize((round(shot.width*scale),round(shot.height*scale)),Image.Resampling.LANCZOS)
    # Screenshot pixels are preserved apart from proportional display scaling.
    im.paste(shot,(1320+(2360-shot.width)//2,460+(1470-shot.height)//2))
    d.text((160,2040),'Captures réelles de l’interface · Données de démonstration fictives · Montage commenté',font=font(33),fill='#b0c6bf')
    im.save(TEMP/f'frame-{i}.png')

scenes=[
 dict(title='La review devient consultable',capture='findings.jpg',command='npx devmethod-ai@0.3.1 '+chr(92)+'\n  review --demo '+chr(92)+'\n  --output review.html --open',explanation='Une interface locale pour relier constats, preuves et corrections.',note='HTML autonome hors ligne. La commande présente des résultats enregistrés ; elle ne réalise pas la review.',voice='Dev Method ajoute maintenant une interface de review. Voici sa démonstration fictive, distincte des résultats réels du pilote Lisière. Cette commande ouvre un rapport local.'),
 dict(title='Retrouver le constat utile',capture='filtered.jpg',command='Constats → Rechercher\n« silencieux »',explanation='Rechercher, filtrer et sélectionner sans confondre gravité et confiance.',note='Un constat confirmé et un risque à vérifier restent distincts. Les compteurs décrivent toute la review.',voice='La recherche isole un constat. Les filtres distinguent domaine, gravité, confiance et résolution. Un risque à vérifier reste une hypothèse, pas un défaut confirmé.'),
 dict(title='Comprendre, puis corriger',capture='correction.jpg',command='Preuve → Correction\n→ Vérification attendue',explanation='Du scénario observé à la correction et à sa nouvelle vérification.',note='Le ticket complète le constat. Fermer le panneau ne résout jamais le problème.',voice='Chaque constat relie scénario, preuve, impact et correction. La vérification attendue et le ticket restent accessibles. Masquer un résultat ne le marque pas comme résolu.'),
 dict(title='Voir la couverture réelle',capture='coverage.jpg',command='Couverture\nRéussi · Échec · Non exécuté',explanation='Les contrôles ont leur propre statut, indépendant du nombre de constats.',note='Une zone non inspectée ne devient pas verte. La révision et les limites restent visibles.',voice='La couverture sépare les contrôles réussis, en échec et non exécutés. L’absence de constat ne prouve pas que tout a été vérifié.'),
 dict(title='Vérifier les références',capture='sources.jpg',command='Sources\nVersion → Provenance → Usage',explanation='Une référence connue n’est pas automatiquement une source consultée.',note='La démonstration signale sa référence non vérifiée. Une vraie review consigne sa consultation et ses limites.',voice='Les sources indiquent technologie, version, provenance et usage. Ici, la référence est clairement non vérifiée : cette démonstration ne prétend pas l’avoir consultée.'),
 dict(title='Exporter et reprendre',capture='export.jpg',command='Exporter le rapport\nHTML · Markdown · JSON',explanation='Une source structurée commune pour l’interface et les rapports.',note='Conserver la révision, les preuves et les limites. Le HTML exporté conserve aussi l’état de consultation.',voice='Exportez la même review en HTML, Markdown ou JSON. Les résultats partagent une source commune. Le rapport conserve la révision, les preuves et les limites pour la reprise.'),
]
source=TEMP/'original-0.3.0.mp4'
if not source.exists(): source.write_bytes(subprocess.check_output(['git','show',f'v0.3.0:{MOVIE}']))
# Existing footage and narration are retained. Only the six-second ending is moved.
enc=['-c:v','libx264','-profile:v','high','-level:v','5.1','-pix_fmt','yuv420p','-r','25','-threads','4','-preset','veryfast','-crf','20','-c:a','aac','-ar','48000','-ac','1','-b:a','192k','-video_track_timescale','12800']
for i,s in enumerate(scenes):
    frame(i,s)
    (TEMP/f'voice-{i}.txt').write_text(s['voice'])
    run(['say','-v','Thomas','-r','165','-f',str(TEMP/f'voice-{i}.txt'),'-o',str(TEMP/f'voice-{i}.aiff')])
    s['duration']=math.ceil((duration(TEMP/f'voice-{i}.aiff')+0.8)*25)/25
    clip=TEMP/f'clip-{i}.mp4'
    fingerprint=hashlib.sha256((TEMP/f'frame-{i}.png').read_bytes()+(TEMP/f'voice-{i}.aiff').read_bytes()+json.dumps(enc).encode()).hexdigest()
    cache=TEMP/f'clip-{i}.sha256'
    if not clip.exists() or not cache.exists() or cache.read_text()!=fingerprint:
        run(['ffmpeg','-y','-loop','1','-framerate','25','-i',str(TEMP/f'frame-{i}.png'),'-i',str(TEMP/f'voice-{i}.aiff'),'-vf',f"fade=t=in:st=0:d=0.3,fade=t=out:st={s['duration']-0.3}:d=0.3",'-af','apad','-t',str(s['duration']),*enc,str(clip)])
        cache.write_text(fingerprint)
    print('Review scene encoded',i+1,flush=True)
# Encode only the splice tracks once, leaving the original scene design and timing intact.
if not (TEMP/'before.mp4').exists():
    run(['ffmpeg','-y','-i',str(source),'-t',str(CUT),'-map','0:v:0','-map','0:a:0',*enc,str(TEMP/'before.mp4')])
if not (TEMP/'after.mp4').exists():
    run(['ffmpeg','-y','-ss',str(CUT),'-i',str(source),'-map','0:v:0','-map','0:a:0',*enc,str(TEMP/'after.mp4')])
clips=[TEMP/'before.mp4']+[TEMP/f'clip-{i}.mp4' for i in range(len(scenes))]+[TEMP/'after.mp4']
(TEMP/'concat.txt').write_text('\n'.join(f"file '{p}'" for p in clips))
# Subtitles follow measured segment durations, not estimated spoken word timing.
def seconds(st):
    h,m,sec=st.replace(',','.').split(':');return int(h)*3600+int(m)*60+float(sec)
def stamp(sec):
    n=round(sec*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
original_srt=subprocess.check_output(['git','show','v0.3.0:docs/media/visual-chain/devmethod-du-besoin-au-produit.fr.srt']).decode()
added=sum(duration(p) for p in clips[1:-1]); prefix=duration(clips[0]); items=[]
for block in original_srt.strip().split('\n\n'):
    lines=block.splitlines();a,b=map(seconds,lines[1].split(' --> ')); shift=added+(prefix-CUT) if a>=171.5 else 0
    items.append((a+shift,b+shift,'\n'.join(lines[2:])))
cursor=prefix
for i,s in enumerate(scenes):
    s['start']=cursor
    parts=re.split(r'(?<=[.!?])\s+',s['voice']); spoken=duration(TEMP/f'voice-{i}.aiff');t=cursor
    for part in parts:
        length=spoken*len(part)/sum(map(len,parts));items.append((t,t+length,part));t+=length
    cursor+=duration(TEMP/f'clip-{i}.mp4')
items.sort(); srt=MEDIA/'devmethod-du-besoin-au-produit.fr.srt'
srt.write_text('\n\n'.join(f'{i+1}\n{stamp(a)} --> {stamp(b)}\n{text}' for i,(a,b,text) in enumerate(items))+'\n')
run(['ffmpeg','-y','-f','concat','-safe','0','-i',str(TEMP/'concat.txt'),'-i',str(srt),'-map','0:v:0','-map','0:a:0','-map','1:0','-c:v','copy','-c:a','copy','-c:s','mov_text','-metadata:s:a:0','language=fra','-metadata:s:s:0','language=fra','-movflags','+faststart',str(ROOT/MOVIE)])
manifest=dict(baseTag='v0.3.0',baseSHA256=hashlib.sha256(source.read_bytes()).hexdigest(),insertionSeconds=CUT,baseDuration=duration(source),duration=duration(ROOT/MOVIE),method='Original footage and narration retained; review screenshot chapter inserted before original ending. Re-encoded splice tracks; no original scene regenerated.',scenes=scenes)
(EXT/'scenes.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
run(['ffmpeg','-y','-ss',str(prefix+3),'-i',str(ROOT/MOVIE),'-frames:v','1','-vf','scale=1920:-1',str(MEDIA/'video-preview.jpg')])
print('Final duration',manifest['duration'],flush=True)
