"""Original SKIFT score and effects. Offline asset authoring, not a runtime engine.
Requires Python 3 and ffmpeg only to re-author the MP3. Playback uses Howler.
"""
from pathlib import Path
import array, math, random, shutil, struct, subprocess, wave
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public'/'audio'; OUT.mkdir(parents=True,exist_ok=True)
RATE=22050; rng=random.Random(2026)
def write(name,samples):
    with wave.open(str(OUT/(name+'.wav')),'wb') as f:
        f.setparams((1,2,RATE,0,'NONE','not compressed'))
        f.writeframes(array.array('h',(int(max(-.98,min(.98,x))*32767) for x in samples)).tobytes())
def tone(duration,f0,f1,volume=.5,noise=0):
    out=[];phase=0
    for i in range(int(duration*RATE)):
        t=i/RATE;p=t/duration;phase+=2*math.pi*(f0+(f1-f0)*p)/RATE
        env=min(1,t/.005)*(1-p)**2
        out.append(volume*env*(math.sin(phase)*(1-noise)+(rng.random()*2-1)*noise))
    return out
specs={'dash':(.22,450,85,.45,.14),'pulse':(.48,140,38,.6,.07),'hit':(.22,95,40,.4,.55),'strike':(.15,600,90,.45,.30),'scrap':(.09,1050,1500,.20,0),'cell':(.46,500,1100,.32,0),'shot':(.13,650,180,.25,.07),'clear':(1.1,392,784,.30,0),'fail':(.9,260,90,.35,.1),'boss':(.7,70,110,.4,.12)}
for name,args in specs.items():write(name,tone(*args))
# An eight-bar, 108 BPM electro-acoustic loop in D minor. Two voicings per chord.
beat=60/108;duration=32*beat;samples=[0.0]*int(duration*RATE)
def add(start,duration,freq,vol,kind='pluck'):
    begin=int(start*RATE);length=int(duration*RATE)
    for j in range(length):
        i=begin+j
        if i>=len(samples):break
        t=j/RATE;p=j/max(1,length-1)
        if kind=='kick':v=math.sin(2*math.pi*(48*t+5*(1-math.exp(-t*35))))*math.exp(-t*18)
        elif kind=='hat':v=(rng.random()*2-1)*math.exp(-t*85)
        elif kind=='snare':v=((rng.random()*2-1)*.7+math.sin(2*math.pi*180*t)*.3)*math.exp(-t*27)
        elif kind=='bass':v=math.sin(2*math.pi*freq*t)*min(1,t*80)*(1-p)**1.2
        else:v=(math.sin(2*math.pi*freq*t)+.23*math.sin(4*math.pi*freq*t)+.1*math.sin(6*math.pi*freq*t))*min(1,t*180)*math.exp(-t*5)*(1-p)
        samples[i]+=v*vol
midi=lambda n:440*2**((n-69)/12)
roots=[38,38,34,34,43,43,33,33]
chords=[[62,65,69,72],[62,65,69,76],[58,62,65,69],[58,62,65,72],[55,58,62,65],[55,58,62,69],[57,61,64,67],[57,61,64,70]]
for bar in range(8):
    for b in range(4):
        t=(bar*4+b)*beat
        add(t,.22,50,.34,'kick')
        if b%2:add(t,.16,0,.095,'snare')
        for h in [0,.5]:add(t+h*beat,.045,0,.025,'hat')
        add(t+.03,beat*.64,midi(roots[bar]+(12 if b==3 else 0)),.16,'bass')
    for j,note in enumerate(chords[bar]):
        add((bar*4+j*.75+.25)*beat,.65,midi(note),.085)
        if bar%2:add((bar*4+j*.75+.625)*beat,.42,midi(note+12),.027)
# A quiet syncopated lead, sparse enough not to compete with combat cues.
for b,note in [(2,81),(3.5,77),(6.5,76),(7.25,74),(10,77),(11.5,74),(14.5,72),(15.25,69),(18,74),(19.5,77),(22.5,76),(23.25,74),(26,73),(27.5,76),(30.5,77),(31.25,76)]:add(b*beat,.42,midi(note),.055)
# Music loop has no clicks at the seam; percussive tails remain bounded.
fade=int(.012*RATE)
for i in range(fade):samples[i]*=i/fade;samples[-1-i]*=i/fade
write('shift',samples)
ffmpeg=shutil.which('ffmpeg')
if not ffmpeg:raise SystemExit('ffmpeg is needed to regenerate shift.mp3. The delivered audio is already built.')
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(OUT/'shift.wav'),'-codec:a','libmp3lame','-b:a','96k',str(OUT/'shift.mp3')],check=True)
(OUT/'shift.wav').unlink()
print('Original score and 10 effects generated.')
