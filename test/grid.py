# python3 test/grid.py saida.png a.png b.png ... [--w 640] — monta grade 2 colunas
import sys
from PIL import Image
a=sys.argv[1:];out=a[0];fs=[x for x in a[1:] if not x.startswith('--')];W=640
ims=[Image.open(f).convert('RGB') for f in fs];ims=[i.resize((W,int(i.height*W/i.width))) for i in ims]
cols=2 if len(ims)>1 else 1;rows=(len(ims)+cols-1)//cols;H=ims[0].height
g=Image.new('RGB',(W*cols,H*rows))
for k,i in enumerate(ims):g.paste(i,((k%cols)*W,(k//cols)*H))
g.save(out)
