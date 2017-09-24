
var
	FONT_WIDTH = 32,
	FONT_HEIGHT = 48,
	COLS = 32,
	ROWS = 16,
	FW,
	FH,

// Colour palette definition

	bScanLn = 1,
	bOrange	= 1,
	bBuff	= 1,
	bBW	= 0,

	aPal =
	[
		"#171717",
		"#f00",
		"#0f0",
		"#ff0",
		"#00f",
		"#f0f",
		"#0ff",
		"#fff",
		"#ddd",
		"#7f7f7f",
		"#1f1f1f",
		bOrange	? "#ff7f00" : "#f00",
		bBuff	? "#fff0f0" : "#fff"
	],

// Miscelanious definitions

	bTrans = 0,								// This does not work at the moment
	SX = 4,
	SY = 4,
	XS = SX,
	YS = SY,
	MX = 2,
	MY = 3,
	MXC = 4,
	MYC = 3,
	aF,
	aP,
	fP,

	aLen = [512, 1024, 1024, 2048, 1536, 3072, 3072, 6144, 6144],
	c1,
	c2,
	c3,
	c4,
	c5,
	e1,
	e2,
	e3,
	e4,
	e5,
	$v,

	bCanvas = false,
	nMode = 0,
	nPal = 1,
	nLen,
	bpb=8,				// Bits Per Byte
	ppb=4,				// Pixels Per Byte
	bpp=bpb/ppb,		// Bits Per Pixel
	bpr=8,				// Bits Per Row
	bpc=(256/bpr)|0,	// Bits Per Column
	cpc=2,				// Columns Per Colour
	rpc=3,				// Rows Per Colour
	cols=32,			// COLumnS
	rows=256/cols,		// ROWS
	cw=8,				// Column Width
	ch=12;				// Column Height

function fInitCanvas()
{
	var c,i,j,k,s,
	x=cw*cols,
	y=ch*rows*2,
	WW=window.innerWidth,
	WH=window.innerHeight;

	YS=(WH/y)|0;
	XS=(WW/x)|0;
	XS=(YS=YS<1?1:YS);
	x*=XS;y*=YS;

	if (bpr*bpc<256)++bpc;
	if ($v) e5.style.display = "none";
	if (!(c=fMakeCanvas(SX*bpb*bpr*cpc,SY*bpc*rpc,0)).e) return null;
	for(e1=c.e,c1=c.c,i=0,j=aPal.length;i<j;++i)aPal[i]=bBW?fBW(aPal[i]):aPal[i];
	e2=(c=fMakeCanvas(SX*bpb*bpr*cpc,SY*bpc*rpc,0)).e,c2=c.c;
	e3=(c=fMakeCanvas(SX*cw*cols,SY*ch*rows*2,0)).e,c3=c.c;
	e4=(c=fMakeCanvas(SX*cw*cols,SY*ch*rows*2,0)).e,c4=c.c;
	e5=(c=fMakeCanvas(x,y,1)).e,c5=c.c;

	c2.fillStyle="#0f0f0f";c2.fillRect(0,0,512,384);c2.fillStyle="#1f1f1f";for(s=0;s<384;++s)c2.fillRect(0,s++,512,1);

//	s=e4.style;s.position="absolute";s.left=(((WW/2)|0)-((x/2)|0))+"px";s.top="0px";

	s=e5.style;s.position="absolute";
	s.left=(((WW/2)|0)-((x/2)|0))+"px";s.top=(((WH/2)|0)-((y/2)|0))+"px";
//	s.border="1px solid red"; s.display="none";

/*
;	Colourset 1							Colourset 2
;  aP[0][0] = CLEAR0				aP[1][0] = CLEAR0
;  aP[0][1] = CLEAR1, colour		aP[1][1] = CLEAR1, colour
;  aP[0][2] = CLEAR1				aP[1][2] = CLEAR1
;  aP[0][3] = CLEAR2, colour		aP[1][3] = CLEAR2, colour
;  aP[0][4] = CLEAR2				aP[1][4] = CLEAR2
;  aP[0][5] = CLEAR3, colour		aP[1][5] = CLEAR3, colour
;  aP[0][6] = CLEAR3				aP[1][6] = CLEAR3
;  aP[0][7] = CLEAR4, colour		aP[1][7] = CLEAR4, colour
;  aP[0][8] = CLEAR4				aP[1][8] = CLEAR4
*/

	aF =
	[
		[
			"3,(v%"+cols+")*"+XS*cw+",((v/"+cols+")|0)*"+YS*ch+','+XS*cw+','+YS*ch+",(a&31)*"+XS*cw+",(a>>5)*"+YS*ch+','+XS*cw+','+YS*ch,
			"3,SX*128+(v&7)*64,SY*96+(v>>3)*12,64,12,(a&15)*64,(a>>4)*12,64,12",
			"3,(v&7)*64,SY*96+(v>>3)*12,64,12,(a&15)*64,(a>>4)*12,64,12",
			"1,256+(v&7)*32,(v>>3)*12,32,12,(a&31)*32,(a>>5)*12,32,12",
			"3,(v&7)*64,SY*96+(v>>3)*12,64,8,(a&15)*64,(a>>4)*8,64,8",
			"1,256+(v&7)*32,(v>>3)*12,32,8,(a&31)*32,(a>>5)*8,32,8",
			"3,(v&7)*64,SY*96+(v>>3)*12,64,4,(a&15)*64,(a>>4)*4,64,4",
			"1,"+XS*bpb*bpr+"+(v%"+bpr+")*"+XS*bpb+",((v/"+bpr+")|0)*"+YS*MYC+','+XS*bpb+','+YS+",(a&31)*"+XS*bpb+",(a>>5)*"+YS+','+XS*bpb+','+YS,
			"1,(v&7)*32,(v>>3)*4,32,4,(a&31)*32,(a>>5)*4,32,4"
		],
		[
			"4,(v%"+cols+")*"+XS*cw+",((v/"+cols+")|0)*"+YS*ch+','+XS*cw+','+YS*ch+",(a&31)*"+XS*cw+",(a>>5)*"+YS*ch+','+XS*cw+','+YS*ch,
			"4,SX*128+(v&7)*64,SY*96+(v>>3)*12,64,12,(a&15)*64,(a>>4)*12,64,12",
			"4,(v&7)*64,SY*96+(v>>3)*12,64,12,(a&15)*64,(a>>4)*12,64,12",
			"2,256+(v&7)*32,(v>>3)*12,32,12,(a&31)*32,(a>>5)*12,32,12",
			"4,(v&7)*64,SY*96+(v>>3)*12,64,8,(a&15)*64,(a>>4)*8,64,8",
			"2,256+(v&7)*32,(v>>3)*12,32,8,(a&31)*32,(a>>5)*8,32,8",
			"4,(v&7)*64,SY*96+(v>>3)*12,64,4,(a&15)*64,(a>>4)*4,64,4",
			"2,"+XS*bpb*bpr+"+(v%"+bpr+")*"+XS*bpb+",((v/"+bpr+")|0)*"+YS*MYC+','+XS*bpb+','+YS+",(a&31)*"+XS*bpb+",(a>>5)*"+YS+','+XS*bpb+','+YS,
//			"2,(v&7)*32,256+(v>>3)*4,32,4,(a&31)*32,(a>>5)*4,32,4"
			"2,(v&7)*32,256+(v>>3)*4,32,4,(a&31)*32,(a>>5)*4,32,4"
		]
	];
	fInitGraph(); // alert(aP[0][7])

	for(i=0;i<aPal.length;++i) {
		fBlock(c1,SX*MXC*i,SY*bpc*(rpc-1),SX*MXC,SY*MYC,i,0);
		fBlock(c1,SX*MXC*i,SY*bpc*(rpc-1)+SY*MY-1,SX*MXC,SY*MYC,i,1); }
	fBlock(c1,0,0,XS*bpb*bpr,YS*bpc*(rpc-1),10,s=bScanLn&&YS>1&&!(YS&1));
	fBlock(c1,XS*bpb*bpr,0,XS*bpb*bpr,YS*bpc*rpc,2,s);
	fBlock(c2,0,0,XS*bpb*bpr,YS*bpc*(rpc-1),10,s);
	fBlock(c2,XS*bpb*bpr,0,XS*bpb*bpr,YS*bpc*rpc,12,s);
	for(i=1;i<256;++i)
		for(x=i%bpr,y=(i/bpr)|0,j=0;j<bpb;++j) {
			for(k=0;k<rpc;++k)if(i&(128>>j)) {
				k-2?fPixel(c1,XS*bpb*x+XS*j,YS*bpc*k+YS*y,XS,YS,k+2,s):0;
				fPixel(c2,XS*bpb*x+XS*j,YS*bpc*k+YS*y,XS,YS,k?k-1?7:6:1,s); }
			if(k=(i>>((3-j)<<1))&3) {
				fPixel(c1,XS*bpb*bpr+XS*bpb*x+XS*j*bpp,YS*y*MYC,XS*bpp,YS*MYC,k-3?k+2:1,s);
				fPixel(c2,XS*bpb*bpr+XS*bpb*x+XS*j*bpp,YS*y*MYC,XS*bpp,YS*MYC,k-3?7-k:11,s); } }
		fBlock(c3,0,YS*rows*ch,XS*bpb*bpr*MX,YS*bpc*MYC,10,s);
		fBlock(c3,XS*bpb*bpr*MX,YS*rows*ch,XS*bpb*bpr*MX,YS*bpc*MYC,2,s);
		fBlock(c4,0,YS*rows*ch,XS*bpb*bpr*MX,YS*bpc*MYC,10,s);
		fBlock(c4,XS*bpb*bpr*MX,YS*rows*ch,XS*bpb*bpr*MX,YS*bpc*MYC,12,s);
		for(i=1;i<256;++i)
			for(x=i%bpr,y=(i/bpr)|0,j=0;j<bpb;++j) {
				if(i&(128>>j)) {
					fPixel(c3,XS*bpb*MX*x+XS*MX*j,YS*rows*ch+YS*MY*y,XS*MX,YS*MY,2,s);
					fPixel(c4,XS*bpb*MX*x+j*XS*MX,YS*rows*ch+YS*MY*y,XS*MX,YS*MY,12,s); }
				if(k=(i>>((3-j)<<1))&3) {
					fPixel(c3,XS*bpb*bpr*MX+XS*bpb*MX*x+XS*MXC*j,YS*rows*ch+y*YS*MYC,XS*MXC,YS*MY,k-3?k+2:1,s);
					fPixel(c4,XS*bpb*bpr*MX+XS*bpb*MX*x+XS*MXC*j,YS*rows*ch+y*YS*MYC,XS*MXC,YS*MY,k-3?7-k:11,s); } }
			for(i=0;i<256;fChar(i++,1))fChar(i);
	return $v = c5;
}

function fInitGraph(i,j)
{
	for(aP=[],i=0;i<2;++i)
		for(aP[i]=[],j=0;j<9;++j)
			fMacro("aP["+i+"]["+j+"]=function(a,v){$v.drawImage(e"+aF[i][j]+")}");
}

function fMacro(s)
{
	eval(s);
}

function fMakeCanvas(w,h,a,p,e,c)
{
	if(e=(c=document).createElement("canvas")) {
		e.width=w;e.height=h;
		if(a)(p||c.body).appendChild(e);
		c=e.getContext("2d"); }
	return{e:e,c:e?c:e};
}

function fBlock(g,x,y,w,h,c,s)
{
	g.fillStyle=c=aPal[c];
	g.fillRect(x,y,w,h);
	if(s)for(g.fillStyle=fR2H((c=fI2R(fH2I(c))).r>>1,c.g>>1,c.b>>1),h+=y;++y<h;g.fillRect(x,y++,w,1));
}

function fPixel(g,x,y,w,h,c,s)
{
	fClone(e1,g,SX*MXC*c,SY*bpc*(rpc-1)+s*((SY*MYC)-1),w,h,x,y,w,h);
}

function fChar(c,s,i,j,k,l,x,y)
{
	for(l=c>>6,i=0,j=s||l>2?e2:e1,k=s?c4:c3,x=XS*cw*(c%cols),y=YS*ch*((c/cols)|0),c=aChars[c];i<ch;i++)fByte(j,k,c[i],x,YS*i+y,l);
}

function fByte(s,d,b,x,y,l)
{
	fClone(s,d,XS*bpb*(b%bpr),YS*((b/bpr)|0)+(l-1?0:YS*bpc),XS*bpb,YS,x,y,XS*bpb,YS);
}

function fClone(s,d,sx,sy,sw,sh,dx,dy,dw,dh)
{
	d.drawImage(s,sx,sy,sw,sh,dx,dy,dw,dh);
}

function fR2H(r,g,b)
{
	return '#'+fHxB(r)+fHxB(g)+fHxB(b);
}

function fI2R(n)
{
	return n>=0&&n<=0xffffff?{r:n>>16,g:n>>8&255,b:n&255}:{r:0,g:0,b:0};
}

function fH2I(h,e,l,n)
{
	return(l=h.length)-7&&l-4?e||"":(n=parseInt(h.substr(1),16),l-7?(n&15)*17+(n&240)*272+(n&3840)*4352:n);
}

function fHxB(n)
{
	return((n&=255)<16?'0':"")+n.toString(16);
}

function fGrSc(r,g,b)
{
	return(27*r+53*g+10*b)/90;
}

function fBW(v)
{
	return fR2H(v=fGrSc((v=fI2R(fH2I(v))).r,v.g,v.b),v,v);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
;
;	Switch to CLEAR mode
;
;		mode					palette
;	---------------------------------------
;		m =  0,		CLEAR0		p = 0
;		m =  1,		CLEAR1		colour
;		m =  3,		CLEAR1
;		m =  5,		CLEAR2		colour
;		m =  7,		CLEAR2
;		m =  9,		CLEAR3		colour
;		m = 11,		CLEAR3
;		m = 13,		CLEAR4		colour
;		m = 15,		CLEAR4
;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function fMode(m,p)
{
	if(nMode-m||nPal-p)
	{
		nMode=m;
		nPal=p;
		fP=bCanvas?aP[p][m=++m>>1]:fSprite;
		nLen=aLen[m];
		fReDraw();
	}
}

function fReDraw(i)
{
	for(i=0;i<nLen;i++) fP(i,MEM[HIMEM+i]);
}

function fSprite(a,v)
{
	fCell(Math.floor(a/COLS),a&31).style.backgroundPosition=fChrPos(v);
}

////////////////////////////////////////////////////////////////////////////

// Legacy sprite stuff - Will go soon!

function fDisplay()
{
	if (bCanvas=fInitCanvas()?1:0) return;
	var
		x,
		y,
		oCell=document.createElement("b");
	oCell.className="cBlock cChar"+(bGreen?"Grn":"");
	oScr=$("dTxtScreen");
	for(y=0;y<ROWS;++y)
		for(x=0;x<COLS;++x) {
			oCell.id=fCellId(y,x);
			oScr.appendChild(oCell.cloneNode(false)); }
}

function fTxtScreen()
{
	var x,y,s;
	if(bCanvas) return;
	for(y=0;y<ROWS;++y)
		for(x=0;x<COLS;++x) {
			s=fCell(y,x).style;
			s.width=FW+"px";
			s.height=FH+"px";
			s.top=(y*FH)+"px";
			s.left=(x*FW)+"px";
			s.backgroundPosition=fChrPos(LDB(HIMEM+(y<<5)+x)); }
}

function fChr(r,c,v)
{
	fCell(r,c).style.backgroundPosition=fChrPos(v);
}

function fCell(r,c)
{
	return $(fCellId(r,c));
}

function fCellId(r,c)
{
	return 'r'+r+'c'+c;
}

function fChrPos(c)
{
	return '-'+((c&31)*FW)+"px -"+((c>>5)*FH)+"px";
}
