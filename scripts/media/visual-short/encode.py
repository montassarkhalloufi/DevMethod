import pathlib,json,subprocess,re
r=pathlib.Path('/private/tmp/devmethod-shortfilm');o=pathlib.Path('docs/media/visual-chain');s=json.loads((r/'scenes.json').read_text());t=json.loads((r/'times.json').read_text());base=t[0]['start'];total=t[-1]['start']-base
subs=[];concat=[]
def run(a):
 p=subprocess.run(a,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 if p.returncode:raise RuntimeError(p.stderr.decode()[-1500:])
def stamp(v):
 m=round(v*1000);return f'{m//3600000:02}:{m//60000%60:02}:{m//1000%60:02},{m%1000:03}'
for i,scene in enumerate(s):
 duration=t[i+1]['start']-t[i]['start'];run(['ffmpeg','-y','-i',str(r/f'audio/{i}.aiff'),'-af','apad','-t',str(duration),'-ar','48000','-c:a','pcm_s16le',str(r/f'audio/{i}.wav')]);concat.append(f"file '{r}/audio/{i}.wav'")
 parts=re.split(r'(?<=[.!?])\s+',scene['voice']);cursor=t[i]['start']-base;spoken=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(r/f'audio/{i}.aiff')]))
 for part in parts:
  length=spoken*len(part)/sum(map(len,parts));subs.append(f'{len(subs)+1}\n{stamp(cursor)} --> {stamp(cursor+length)}\n{part}\n');cursor+=length
(r/'audio-concat.txt').write_text('\n'.join(concat));(o/'devmethod-visuel.fr.srt').write_text('\n'.join(subs))
fixed=json.loads((r/'app-final-times.json').read_text());newbase=fixed[0]['start'];appstart=t[11]['start'];append=t[12]['start'];d=append-appstart
vf=f"[0:v]trim=start={base}:end={appstart},setpts=PTS-STARTPTS[a];[1:v]trim=start={newbase},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=30,trim=duration={d}[b];[0:v]trim=start={append}:end={t[-1]['start']},setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0,fps=25,format=yuv420p[v]"
run(['ffmpeg','-y','-i',str(r/'film.webm'),'-i',str(r/'app-final.webm'),'-f','concat','-safe','0','-i',str(r/'audio-concat.txt'),'-i',str(o/'devmethod-visuel.fr.srt'),'-filter_complex',vf,'-map','[v]','-map','2:a','-map','3:0','-t',str(total),'-c:v','libx264','-threads','4','-preset','veryfast','-crf','20','-c:a','aac','-b:a','192k','-c:s','mov_text','-metadata:s:a:0','language=fra','-metadata:s:s:0','language=fra','-movflags','+faststart',str(o/'devmethod-visuel-4k.fr.mp4')]);print('FINAL',total,flush=True)
