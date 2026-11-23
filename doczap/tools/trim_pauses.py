# usage: trim_pauses.py in.mp3 out.mp3  -> shortens inner pauses to 0.2s, keeps the 2 longest at 0.4s
import sys,re,subprocess
src,dst=sys.argv[1],sys.argv[2]
o=subprocess.run(['ffmpeg','-i',src,'-af','silencedetect=noise=-35dB:d=0.25','-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',o)];en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',o)]
dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',src],capture_output=True,text=True).stdout)
sil=[(a,b) for a,b in zip(st,en) if a>0.05 and b<dur-0.05]
keep=sorted(sil,key=lambda x:x[1]-x[0],reverse=True)[:2]
segs=[];t=0.0
for a,b in sil:
    tgt=0.4 if (a,b) in keep else 0.2
    if b-a<=tgt: continue
    cut_a=a+tgt/2; cut_b=b-tgt/2
    segs.append((t,cut_a)); t=cut_b
segs.append((t,dur))
f=';'.join(f'[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={max(0,b-a-0.01):.3f}:d=0.01[s{i}]' for i,(a,b) in enumerate(segs))
f+=';'+''.join(f'[s{i}]' for i in range(len(segs)))+f'concat=n={len(segs)}:v=0:a=1[o]'
subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-filter_complex',f,'-map','[o]','-c:a','libmp3lame','-q:a','2',dst],check=True)
nd=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',dst],capture_output=True,text=True).stdout)
print(f'trimmed {dur:.2f}s -> {nd:.2f}s ({len(segs)-1} pauses shortened)')
