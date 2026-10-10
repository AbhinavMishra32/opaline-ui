"""Every onset in the soundtrack, by band, written to hits.json for the film."""
import subprocess, json, numpy as np, imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe(); SR=44100
x=np.frombuffer(subprocess.run([FF,"-v","quiet","-i","../../launch-music-trimmed.mov","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,np.float32)
n=1024; hop=220
win=np.hanning(n); frames=(len(x)-n)//hop
S=np.abs(np.array([np.fft.rfft(x[i*hop:i*hop+n]*win) for i in range(frames)])).T
f=np.fft.rfftfreq(n,1/SR); t=(np.arange(frames)*hop+n/2)/SR
def flux(lo,hi):
    B=np.log(S[(f>=lo)&(f<hi)]+1e-4); d=np.maximum(0,np.diff(B,axis=1)).mean(0); return np.concatenate([[0],d])
def peaks(d,k,sep):
    thr=np.median(d)+k*np.std(d); out=[]
    for i in range(2,len(d)-2):
        if d[i]>thr and d[i]==d[i-2:i+3].max():
            if not out or t[i]-out[-1][0]>sep: out.append((round(float(t[i]),3),round(float(d[i]),3)))
            elif d[i]>out[-1][1]: out[-1]=(round(float(t[i]),3),round(float(d[i]),3))
    return out
low=peaks(flux(25,140),2.0,0.12)
mid=peaks(flux(140,3000),2.0,0.06)
hi=peaks(flux(3000,16000),2.0,0.05)
# loudness envelope of the 808 (for sustain shapes)
L=S[(f>=25)&(f<140)].mean(0); env=(L/L.max())
res={"dur":len(x)/SR,"low":low,"mid":mid,"hi":hi,
     "env":[round(float(env[(t>=s)&(t<s+1/60)].mean()) if ((t>=s)&(t<s+1/60)).any() else 0,3) for s in np.arange(0,len(x)/SR,1/60)]}
json.dump(res,open("hits.json","w"))
for k in ["low","mid","hi"]:
    print(k,len(res[k])); print("  "+" ".join(f"{a:.2f}" for a,_ in res[k]))
