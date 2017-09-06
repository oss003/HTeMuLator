
// MOS 6502 processor emulator in JavaScript - P. Mainwaring, Dec 2011

// Dependencies - B64: Base 64 decode for unpacking data (not yet!), HEX: Print byte in hex for printing registers / debug / log

/*
TO DO:
	- Check BCD tables against output of DAA (Decimal Add Adjust) function in my i8085a emulator
	- Make ADD, SUB, INC, DEC "real" byte operations with two's compliment, etc. for speed and authenticity as per my i8085a emulator
	- Make clock count down instead of up as in my i8085a emulator? Yes, cycles remaining can then be stored and set to zero to pause the emulator
	- Make data dictionary from comments to act as quick guide when renaming mnemonics to single character names
	- Definitely need single character names (meaningful or not) for addressing modes as they are used extensively and by nearly every instruction
	- "Macros" to build code from instruction set OpCodes and data; Merge bits of existing 6502 data - use constructed strings and "with"?
	- Make MEM and CPU sections of code into proper, inter-related objects
	- Re-Check final code, variables and data against ATAP Mnemonic Assembler and MOS 6502 datasheet pdf
	- Add undocumented and illegal opcodes; coded in: 6502.c, 6502core.cpp and z80.cpp

DONE:
	- CLD & SED now set pointers to ADD & SUB functions; CLD & SED are not *too* time critical but ADD & SUB are - point to ADB (AdD Binary) and ADD (AdD Decimal)
	- Make TIK (TIcKs, i.e cycle times) and TOK (TOcKs, i.e. extra cycles) tables, etc. from data in opcode_data.txt

NB:
	Expressions such as ' << FLC ' and ' >> FLD ' are not typos. Although the names make no sense the values are correct and since the names will be
	compacted to single character CONSTANTS the resultant, compacted code will run faster

*/

// "Globals"

NUL	= 0;					// Constant for 0 for increased speed when crunched to single character variable names (use "False")	-> F

BYT	= 0xFF;					// Mask for BYTes - used extensively														-> B
WRD	= 0xFFFF;				// Mask for WoRDs - used extensively														-> W
MSB	= 0xFF00;				// Most Significant Byte; M and m used as STB & LDB (STore Byte and LoaD Byte (use "Upper")	-> U

HND	= 100;					// Constant for 100 in BCD - redundant?

// User interface			// Not time critical

LOG	= true;					// Turn debug on / off
RDY	= true;					// 6502 RDY signal
BRQ	= false;				// BRK signal encountered
PHI	= 0;					// Clock -> CLK ?

// Processor Workspace Variables

OPC	= NUL;					// OPCode
CLK	= NUL;					// CLocK
TOK	= NUL;					// TOcK
EXC	= NUL;					// EXtra Cycles

AIR	= NUL;					// AIR (ALU A Input Register)
BIR	= NUL;					// BIR (ALU B Input Register)
RSB	= NUL;					// RSB (ReSult Byte)
RSW	= NUL;					// RSW (ReSult Word)

// "Constants"

// 0x80 0x40 0x20 0x10 0x08 0x04 0x02 0x01
//  7    6    5    4    3    2    1    0
//  N    V    R    B    D    I    Z    C

FLC	= 0x01;					// Carry FLag						-> c
FLZ	= 0x02;					// Zero FLag						-> z
FLI	= 0x04;					// Interrupt FLag					-> i
FLD	= 0x08;					// Decimal FLag						-> d
FLB	= 0x10;					// Break FLag						-> b
FLR	= 0x20;					// Reserved FLag		(Not Used)
FLV	= 0x40;					// oVerflow FLag					-> v
FLN	= 0x80;					// Negative FLag					-> n

F_C	= BYT - FLC;			// Not Carry Flag		(~FLC)		-> C
F_Z	= BYT - FLZ;			// Not Zero Flag		(~FLZ)		-> Z
F_I	= BYT - FLI;			// Not Interrupt Flag	(~FLI)		-> I not used anywhere so free up variable I for Instruction
F_D	= BYT - FLD;			// Not Decimal Flag		(~FLD)		-> D not used anywhere so free up variable D
F_B	= BYT - FLB;			// Not Break Flag		(~FLB)		-> B not used anywhere so free up variable B for Byte
							// Reserved FLag		(Not Used)
F_V	= BYT - FLV;			// Not oVerflow Flag	(~FLV)		-> V
F_N	= BYT - FLN;			// Not Negative Flag	(~FLN)		-> N

STK	= 0x0100;				// Hardware stack memory address	-> S
RSV	= 0xFFFC;				// ReSet Vector
IRV	= 0xFFFE;				// Interrupt Request Vector
NMV	= 0xFFFA;				// Non Maskable interrupt Vector
ERV	= 0xC9E4;				// "ERror Vector" Error printing routine address in BASIC ROM	-> E ? Move to higher level

// 8 Bit Reg's

ACC	= NUL;					// ACCumulator						-> a
XIR	= NUL;					// X Index Register					-> x
YIR	= NUL;					// Y Index Register					-> y
FLG	= NUL;					// FLaGs							-> f
SPR	= BYT;					// Stack Pointer Register			-> s

// Strictly speaking ACC should be ACR (ACcumulator Register) so that we can have a function for ACCumulator addressing mode
// Strictly speaking FLG should be PSR (Processor Status Register) but P will be used for PCR and S for SPR -> F

// 16 Bit Reg's

PCR	= NUL;					// Program Counter Register			-> p

NME	= "MOS 6502";			// Processor name					-> N / n in use - use full mnemonic NME

// Functions

// Memory Addressing Functions

// Generic Memory Addressing Functions

IMW	= function(AIR){return LDB(AIR++)|LDB(AIR&WRD)<<FLD}												// Immediate Word (at address)
IMB	= function(){return LDB(PCR++)}																		// Immediate Byte (at program counter)

// 6502 Memory Addressing Functions
																										// INValid					0	1
																										// IMPlied					1	1
																										// ACCumulator				2	1
IMM	= function(){return PCR++}																			// IMMediate Address		3	2
ZPG	= IMB;																								// Zero PaGe				4	2
ZPX	= function(){return(XIR+LDB(PCR++))&BYT}															// Zero Page,X				5	2
ZPY	= function(){return(YIR+LDB(PCR++))&BYT}															// Zero Page,Y				6	2
//XID	= function(){return IMW(LDB(PCR++)+XIR)}														// (InDirect,X)				7	2
XID=function(){return IMW((LDB(PCR++)+XIR)&BYT)}														// (InDirect,X)				7	2
IDY	= function(){return BIR=((AIR=IMW(LDB(PCR++)))+YIR)&WRD,(EXC&&AIR&MSB!=BIR&MSB?++CLK:NUL),BIR}		// (InDirect),Y				8	2
BRA	= function(){return AIR=IMB(),AIR=PCR-(AIR&FLN?STK-AIR:-AIR),(CLK+=PCR&MSB!=AIR&MSB?FLZ:FLC),AIR}	// relative BRAnch address	9	2
																										// INDirect					A	3
ABS	= function(){return IMW(AIR=PCR,PCR+=FLZ,AIR)}														// ABSolute					B	3
ABX	= function(){return BIR=((AIR=ABS())+XIR)&WRD,(EXC&&AIR&MSB!=BIR&MSB?++CLK:NUL),BIR}				// ABsolute,X				C	3
ABY	= function(){return BIR=((AIR=ABS())+YIR)&WRD,(EXC&&AIR&MSB!=BIR&MSB?++CLK:NUL),BIR}				// ABsolute,Y				D	3

// Operations

// Stack Operations

PHB	= function(AIR){MEM[STK|SPR]=AIR;SPR=--SPR&BYT}			// PusH Byte - Uses MEM directly for speed
PHW	= function(AIR){PHB(AIR>>FLD);PHB(AIR&BYT)}				// PusH Word - Calls PusH Byte twice
PLB	= function(){return MEM[STK|(SPR=++SPR&BYT)]}			// PulL Byte - Uses MEM directly for speed
PLW	= function(){return PLB()|PLB()<<FLD}					// PulL Word - Calls PulL Byte twice

// PLB	= function(){return MEM[STK|(SPR=++SPR&BYT)]||NUL}	// PulL Byte - Uses MEM directly for speed
// PHB	= function(AIR){MEM[STK+(SPR--)]=AIR}				// PusH Byte - Uses MEM directly for speed
// PLB	= function(){return MEM[STK+(++SPR)]}				// PulL Byte - Uses MEM directly for speed
// #define push(v) ram[0x100+(s--)]=v
// #define pull()  ram[0x100+(++s)]

// Flag Operations

CLR	= function(AIR){FLG&=~AIR}								// CLeaRs a flag	- Use bit flipping and make redundant?
SET	= function(AIR){FLG|=AIR}								// SETs a flag		- Use bit flipping and make redundant?
FNZ	= function(AIR){FLG=FLG&F_N&F_Z|(AIR?AIR&FLN:FLZ)}		// Flags N & Z		- Negative and Zero

// RMW / ALU (Read, Modify, Write and Arithmetic & Logic Unit) Operations

// BAD = Binary ADd; DAD = Decimal ADd; BSB = Binary SuBtract; DSB = Decimal SuBtract

// These need looking at closer; especially those shifting/rotating right (making operand > 256?)

//BAD	= function(AIR){ACC+=AIR+(FLG&FLC);FLG&=F_N&F_V&F_Z&F_C;ACC>BYT?(FLG|=FLV|FLC,ACC&=BYT):NUL;ACC?FLG|=ACC&FLN:FLG|=FLZ}

BAD = function(AIR){
var sum=ACC+AIR+(FLG&FLC);
FLG&=F_N&F_V&F_Z&F_C;
if ((ACC^sum)&(AIR^sum)&0x80) FLG|=FLV;
if (sum > BYT) FLG|=FLC;
ACC=sum&BYT;FLG|=ACC&FLN;if (!ACC) FLG|=FLZ
}

//DAD	= function(AIR){ACC=B2D[ACC]+B2D[AIR]+(FLG&FLC);FLG&=F_N&F_V&F_Z&F_C;ACC>=HND?(FLG|=FLC|FLV,ACC-=HND):NUL;ACC?FLG|=ACC&FLN:FLG|=FLZ;ACC=D2B[ACC]}

DAD = function(AIR){
var ah=0,al,tb=(ACC+AIR+(FLG&FLC))&BYT;
FLG&=F_N&F_V&F_Z;
if(!tb)FLG|=FLZ;
al=(ACC&0x0F)+(AIR&0x0F)+(FLG&FLC);
if(al>9){al-=10;al&=0x0F;ah=1}
ah+=(ACC>>4)+(AIR>>4);
if(ah&0x08)FLG|=FLN;
if((((ah<<4)^ACC)&0x80)&&!((ACC^AIR)&0x80))FLG|=FLV;
FLG&=F_C;
if(ah>9){FLG|=FLC;ah-=10;ah&=0x0F}
ACC=(al&0x0F)|(ah<<4)}

//BSB	= function(AIR){ACC-=AIR+(~FLG&FLC);FLG&=F_N&F_V&F_Z&F_C;ACC>NUL?FLG|=FLC:ACC?FLG|=FLV:FLG|=FLZ+FLC;FLG|=ACC&FLN;ACC&=BYT}

BSB = function(AIR){
var diff=ACC-AIR-(~FLG&FLC);
FLG&=F_N&F_V&F_Z&F_C;
if ((ACC^AIR)&(ACC^diff)&0x80) FLG|=FLV;
if (diff >= 0) FLG|=FLC;
ACC=diff&BYT;FLG|=ACC&FLN;if (!ACC) FLG|=FLZ
}

//DSB	= function(AIR){ACC=B2D[ACC]-B2D[AIR]-(~FLG&FLC);FLG&=F_N&F_V&F_Z&F_C;ACC>NUL?FLG|=FLC:ACC?(FLG|=FLN,ACC+=HND):FLG|=FLZ+FLC;ACC=D2B[ACC]}

DSB = function(AIR){
var ah,al,hc=0,c=FLG&FLC?0:1,tb=(ACC-AIR-c)&BYT;
FLG&=F_N&F_V&F_Z;
if(!tb)FLG|=FLZ;
al=(ACC&0x0F)-(AIR&0x0F)-c;
if(al&0x10){al-=6;al&=0x0F;hc=1}
ah=(ACC>>4)-(AIR>>4);
if(hc)ah--;
if((ACC-(AIR+c))&0x80)FLG|=FLN;
if(((ACC^AIR)&0x80)&&((ACC^tb)&0x80))FLG|=FLV;
FLG|=FLC;
if(ah&0x10){FLG&=F_C;ah-=6;ah&=0x0F}
ACC=(al&0x0F)|((ah&0x0F)<<4)}

// COM	= function(AIR,BIR){FLG&=F_N&F_Z&F_C;AIR-BIR?AIR>BIR?FLG|=FLC:FLG|=FLN:FLG|=FLC|FLZ}	// COMpare
COM	= function(AIR,BIR){FLG=FLG&124|(AIR-BIR?AIR<BIR?0:1:3)|((AIR-BIR)&128)}	// COMpare
// COM	= function(AIR,BIR){AIR=AIR>127?-(256-AIR):AIR;BIR=BIR>127?-(256-BIR):BIR;FLG=FLG&124|(AIR-BIR?AIR<BIR?128:1:3)}	// COMpare

// SLA = Shift Left Arithmetic; SRL = Shift Right Logical; RLL = Rotate Left Logical; RRL = Rotate Right Logical

SLA	= function(AIR){return AIR&FLN?FLG|=FLC:FLG&=F_C,FNZ(AIR<<=FLC),AIR&BYT}
SRL	= function(AIR){return FLG&=F_C&F_N&F_Z,FLG|=AIR&FLC,FLG|=(AIR>>=FLC)?NUL:FLZ,AIR}
RLL	= function(AIR){return FLG&FLC?((AIR&FLN?NUL:FLG&=F_C),AIR=AIR<<FLC|FLC):(AIR&FLN?FLG|=FLC:NUL,AIR<<=FLC),FNZ(AIR),AIR&BYT}
RRL	= function(AIR){return FLG&FLC?((AIR&FLC?NUL:FLG&=F_C),AIR=AIR>>FLC|FLN):(AIR&FLC?FLG|=FLC:NUL,AIR>>=FLC),FNZ(AIR),AIR}

// Program Flow Control Operations

BCL	= function(AIR){FLG&AIR?++PCR:PCR=BRA()}					// Branch if flag CLear	- Merge with BRAnch and make redundant?
BST	= function(AIR){FLG&AIR?PCR=BRA():++PCR}					// Branch if flag SeT	- Merge with BRAnch and make redundant?

// Instructions - from here on, function names are as per 6502 mnemonics

// Flag Instructions

BRK	= function(){FLG|=FLB;PHW(++PCR&WRD);PHB(FLG);FLG|=FLI;PCR=IMW(IRV);BRQ=FLC}
CLD	= function(){FLG&FLD?(FLG&=F_D,ADD=BAD,SUB=BSB):0}
SED	= function(){FLG&FLD?0:(FLG|=FLD,ADD=DAD,SUB=DSB)}

// RMW / ALU (Read, Modify, Write and Arithmetic & Logic Unit) Instructions
/*
	LD*, ST*, INC, DEC, ADD, SUB, CM*, BIT, AND, OR, EOR, SH*, RO*

	Read:		Load	LD*				(LDA, LDX, LDY)
	Modify:		ALU		Arithmetic		 INC, DEC, ADC, SBC, CM* (CMP, CPX, CPY - Subtract!), BIT
	Modify:		ALU		Logic / Bit		 AND, ORA, EOR, ASL, LSR, ROL, ROR
	Write:		Store	ST*				(STA, STX, STY)
*/
LDA	= function(AIR){FNZ(ACC=LDB(AIR()))}
LDX	= function(AIR){FNZ(XIR=LDB(AIR()))}
LDY	= function(AIR){FNZ(YIR=LDB(AIR()))}

INC	= function(AIR){AIR=(LDB(BIR=AIR())+FLC)&BYT;FLG&=F_N&F_Z;AIR?FLG|=AIR&FLN:FLG|=FLZ;STB(BIR,AIR)}
DEC	= function(AIR){AIR=(LDB(BIR=AIR())-FLC)&BYT;FLG&=F_N&F_Z;AIR?FLG|=AIR&FLN:FLG|=FLZ;STB(BIR,AIR)}

ADC	= function(AIR){ADD(LDB(AIR()))}
SBC	= function(AIR){SUB(LDB(AIR()))}

CMP	= function(AIR){COM(ACC,LDB(AIR()))}
CPX	= function(AIR){COM(XIR,LDB(AIR()))}
CPY	= function(AIR){COM(YIR,LDB(AIR()))}
BIT	= function(AIR){FLG&=F_N&F_V&F_Z;ACC&(AIR=LDB(AIR()))?NUL:FLG|=FLZ;FLG|=AIR&(FLN|FLV)}

AND	= function(AIR){FNZ(ACC&=LDB(AIR()))}
ORA	= function(AIR){FNZ(ACC|=LDB(AIR()))}
EOR	= function(AIR){FNZ(ACC^=LDB(AIR()))}
ASL	= function(AIR){STB(BIR=AIR(),SLA(LDB(BIR)))}
LSR	= function(AIR){STB(BIR=AIR(),SRL(LDB(BIR)))}
ROL	= function(AIR){STB(BIR=AIR(),RLL(LDB(BIR)))}
ROR	= function(AIR){STB(BIR=AIR(),RRL(LDB(BIR)))}

STA	= function(AIR){STB(AIR(),ACC)}
STX	= function(AIR){STB(AIR(),XIR)}
STY	= function(AIR){STB(AIR(),YIR)}

// Timing Instructions

NOP	= function(){}

// Illegal Instructions

N0P	= function(){fLog("Invalid OP code for "+NME + " AT#" + PCR.toString(16));PCR++} // Note '0' (Zero) in N0P not capital letter 'O' ;-)

// Instruction Codes Table - 256 OpCodes; 151 Instructions (105 unused); 56 Operations

INS =	// INStructions		-> I
[
//								7 6 5 4 3 2 1 0
// OC INS OPERAND	Bytes Cycle	N V R B D I Z C
/* 00 BRK Implied		1 7		~ ~ 1 % ~ % ~ ~ */	BRK,
/* 01 ORA (Indirect,X)	2 6		% ~ 1 ~ ~ ~ % ~ */	function(){ORA(XID)},
/* 02 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 03 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 04 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 05 ORA Zero Page		2 3		% ~ 1 ~ ~ ~ % ~ */	function(){ORA(ZPG)},
/* 06 ASL Zero Page		2 5		% ~ 1 ~ ~ ~ % % */	function(){ASL(ZPG)},
/* 07 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 08 PHP Implied		1 3		~ ~ 1 ~ ~ ~ ~ ~ */	function(){PHB(FLG|FLR|FLB)},
/* 09 ORA Immediate		2 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(ACC|=IMB())},
/* 0A ASL Accumulator	1 2		% ~ 1 ~ ~ ~ % % */	function(){ACC=SLA(ACC)},
/* 0B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 0C *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 0D ORA Absolute		3 4		% ~ 1 ~ ~ ~ % ~ */	function(){ORA(ABS)},
/* 0E ASL Absolute		3 6		% ~ 1 ~ ~ ~ % % */	function(){ASL(ABS)},
/* 0F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 10 BPL Relative		2 2 **	~ ~ 1 ~ ~ ~ ~ ~ */	function(){BCL(FLN)},
/* 11 ORA (Indirect),Y	2 5 *	% ~ 1 ~ ~ ~ % ~ */	function(){ORA(IDY)},
/* 12 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 13 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 14 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 15 ORA Zero Page,X	2 4		% ~ 1 ~ ~ ~ % ~ */	function(){ORA(ZPX)},
/* 16 ASL Zero Page,X	2 6		% ~ 1 ~ ~ ~ % % */	function(){ASL(ZPX)},
/* 17 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 18 CLC Implied		1 2		~ ~ 1 ~ ~ ~ ~ % */	function(){CLR(FLC)},
/* 19 ORA Absolute,Y	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){ORA(ABY)},
/* 1A *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 1B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 1C *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 1D ORA Absolute,X	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){ORA(ABX)},
/* 1E ASL Absolute,X	3 7		% ~ 1 ~ ~ ~ % % */	function(){ASL(ABX)},
/* 1F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 20 JSR Absolute		3 6		~ ~ 1 ~ ~ ~ ~ ~ */	function(){PHW((PCR+FLC)&WRD);PCR=IMW(PCR)},
// 20 JSR Absolute		3 6		~ ~ 1 ~ ~ ~ ~ ~ */	function(){PHW(PCR);PCR=IMW(PCR)}, //addr=getw(); pc--; push(pc >> 8); push(pc); pc=addr;
/* 21 AND (Indirect,X)	2 6		% ~ 1 ~ ~ ~ % ~ */	function(){AND(XID)},
/* 22 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 23 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 24 BIT Zero Page		2 3		% % 1 ~ ~ ~ % ~ */	function(){BIT(ZPG)},
/* 25 AND Zero Page		2 3		% ~ 1 ~ ~ ~ % ~ */	function(){AND(ZPG)},
/* 26 ROL Zero Page		2 5		% ~ 1 ~ ~ ~ % % */	function(){ROL(ZPG)},
/* 27 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 28 PLP Implied		1 4		% % 1 ~ % % % % */	function(){FLG=PLB()|FLR|FLB;FLG&FLD?(ADD=DAD,SUB=DSB):(ADD=BAD,SUB=BSB)},				// function(){FLG=PLB()|FLR|FLB},
/* 29 AND Immediate		2 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(ACC&=IMB())},
/* 2A ROL Accumulator	1 2		% ~ 1 ~ ~ ~ % % */	function(){ACC=RLL(ACC)},
/* 2B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 2C BIT Absolute		3 4		% % 1 ~ ~ ~ % ~ */	function(){BIT(ABS)},
/* 2D AND Absolute		3 4		% ~ 1 ~ ~ ~ % ~ */	function(){AND(ABS)},
/* 2E ROL Absolute		3 6		% ~ 1 ~ ~ ~ % % */	function(){ROL(ABS)},
/* 2F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 30 BMI Relative		2 2 **	~ ~ 1 ~ ~ ~ ~ ~ */	function(){BST(FLN)},
/* 31 AND (Indirect),Y	2 5 *	% ~ 1 ~ ~ ~ % ~ */	function(){AND(IDY)},
/* 32 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 33 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 34 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 35 AND Zero Page,X	2 4		% ~ 1 ~ ~ ~ % ~ */	function(){AND(ZPX)},
/* 36 ROL Zero Page,X	2 6		% ~ 1 ~ ~ ~ % % */	function(){ROL(ZPX)},
/* 37 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 38 SEC Implied		1 2		~ ~ 1 ~ ~ ~ ~ % */	function(){SET(FLC)},
/* 39 AND Absolute,Y	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){AND(ABY)},
/* 3A *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 3B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 3C *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 3D AND Absolute,X	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){AND(ABX)},
/* 3E ROL Absolute,X	3 7		% ~ 1 ~ ~ ~ % % */	function(){ROL(ABX)},
/* 3F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 40 RTI Implied		1 6		% % 1 ~ % % % % */	function(){FLG=PLB()|FLR|FLB;FLG&FLD?(ADD=DAD,SUB=DSB):(ADD=BAD,SUB=BSB);PCR=PLW()},	// function(){FLG=PLB();PCR=PLW()},
/* 41 EOR (Indirect,X)	2 6		% ~ 1 ~ ~ ~ % ~ */	function(){EOR(XID)},
/* 42 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 43 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 44 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 45 EOR Zero Page		2 3		% ~ 1 ~ ~ ~ % ~ */	function(){EOR(ZPG)},
/* 46 LSR Zero Page		2 5		% ~ 1 ~ ~ ~ % % */	function(){LSR(ZPG)},
/* 47 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 48 PHA Implied		1 3		~ ~ 1 ~ ~ ~ ~ ~ */	function(){PHB(ACC)},
/* 49 EOR Immediate		2 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(ACC^=IMB())},
/* 4A LSR Accumulator	1 2		% ~ 1 ~ ~ ~ % % */	function(){ACC=SRL(ACC)},
/* 4B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 4C JMP Absolute		3 3		~ ~ 1 ~ ~ ~ ~ ~ */	function(){PCR=IMW(PCR)},
/* 4D EOR Absolute		3 4		% ~ 1 ~ ~ ~ % ~ */	function(){EOR(ABS)},
/* 4E LSR Absolute		3 6		% ~ 1 ~ ~ ~ % % */	function(){LSR(ABS)},
/* 4F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 50 BVC Relative		2 2 **	~ ~ 1 ~ ~ ~ ~ ~ */	function(){BCL(FLV)},
/* 51 EOR (Indirect),Y	2 5 *	% ~ 1 ~ ~ ~ % ~ */	function(){EOR(IDY)},
/* 52 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 53 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 54 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 55 EOR Zero Page,X	2 4		% ~ 1 ~ ~ ~ % ~ */	function(){EOR(ZPX)},
/* 56 LSR Zero Page,X	2 6		% ~ 1 ~ ~ ~ % % */	function(){LSR(ZPX)},
/* 57 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 58 CLI Implied		1 2		~ ~ 1 ~ ~ % ~ ~ */	function(){CLR(FLI)},
/* 59 EOR Absolute,Y	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){EOR(ABY)},
/* 5A *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 5B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 5C *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 5D EOR Absolute,X	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){EOR(ABX)},
/* 5E LSR Absolute,X	3 7		% ~ 1 ~ ~ ~ % % */	function(){LSR(ABX)},
/* 5F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 60 RTS Implied		1 6		~ ~ 1 ~ ~ ~ ~ ~ */	function(){PCR=PLW()+FLC},
/* 61 ADC (Indirect,X)	2 6		% % 1 ~ ~ ~ % % */	function(){ADC(XID)},
/* 62 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 63 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 64 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 65 ADC Zero Page		2 3		% % 1 ~ ~ ~ % % */	function(){ADC(ZPG)},
/* 66 ROR Zero Page		2 5		% ~ 1 ~ ~ ~ % % */	function(){ROR(ZPG)},
/* 67 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 68 PLA Implied		1 4		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(ACC=PLB())},
/* 69 ADC Immediate		2 2		% % 1 ~ ~ ~ % % */	function(){ADC(IMM)},
/* 6A ROR Accumulator	1 2		% ~ 1 ~ ~ ~ % % */	function(){ACC=RRL(ACC)},
/* 6B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 6C JMP (Indirect)	3 5		~ ~ 1 ~ ~ ~ ~ ~ */	function(){PCR=IMW(IMW(PCR))},
/* 6D ADC Absolute		3 4		% % 1 ~ ~ ~ % % */	function(){ADC(ABS)},
/* 6E ROR Absolute		3 6		% ~ 1 ~ ~ ~ % % */	function(){ROR(ABS)},
/* 6F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 70 BVS Relative		2 2 **	~ ~ 1 ~ ~ ~ ~ ~ */	function(){BST(FLV)},
/* 71 ADC (Indirect),Y	2 5 *	% % 1 ~ ~ ~ % % */	function(){ADC(IDY)},
/* 72 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 73 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 74 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 75 ADC Zero Page,X	2 4		% % 1 ~ ~ ~ % % */	function(){ADC(ZPX)},
/* 76 ROR Zero Page,X	2 6		% ~ 1 ~ ~ ~ % % */	function(){ROR(ZPX)},
/* 77 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 78 SEI Implied		1 2		~ ~ 1 ~ ~ % ~ ~ */	function(){SET(FLI)},
/* 79 ADC Absolute,Y	3 4 *	% % 1 ~ ~ ~ % % */	function(){ADC(ABY)},
/* 7A *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 7B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 7C *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 7D ADC Absolute,X	3 4 *	% % 1 ~ ~ ~ % % */	function(){ADC(ABX)},
/* 7E ROR Absolute,X	3 7		% ~ 1 ~ ~ ~ % % */	function(){ROR(ABX)},
/* 7F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 80 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 81 STA (Indirect,X)	2 6		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STA(XID)},
/* 82 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 83 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 84 STY Zero Page		2 3		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STY(ZPG)},
/* 85 STA Zero Page		2 3		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STA(ZPG)},
/* 86 STX Zero Page		2 3		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STX(ZPG)},
/* 87 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 88 DEY Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(YIR=--YIR&BYT)},
/* 89 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 8A TXA Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(ACC=XIR)},
/* 8B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 8C STY Absolute		3 4		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STY(ABS)},
/* 8D STA Absolute		3 4		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STA(ABS)},
/* 8E STX Absolute		3 4		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STX(ABS)},
/* 8F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 90 BCC Relative		2 2 **	~ ~ 1 ~ ~ ~ ~ ~ */	function(){BCL(FLC)},
/* 91 STA (Indirect),Y	2 6		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STA(IDY)},
/* 92 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 93 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 94 STY Zero Page,X	2 4		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STY(ZPX)},
/* 95 STA Zero Page,X	2 4		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STA(ZPX)},
/* 96 STX Zero Page,Y	2 4		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STX(ZPY)},
/* 97 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 98 TYA Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(ACC=YIR)},
/* 99 STA Absolute,Y	3 5		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STA(ABY)},
/* 9A TXS Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){SPR=XIR},
/* 9B *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 9C *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 9D STA Absolute,X	3 5		~ ~ 1 ~ ~ ~ ~ ~ */	function(){STA(ABX)},
/* 9E *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* 9F *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* A0 LDY Immediate		2 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(YIR=IMB())},
/* A1 LDA (Indirect,X)	2 6		% ~ 1 ~ ~ ~ % ~ */	function(){LDA(XID)},
/* A2 LDX Immediate		2 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(XIR=IMB())},
/* A3 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* A4 LDY Zero Page		2 3		% ~ 1 ~ ~ ~ % ~ */	function(){LDY(ZPG)},
/* A5 LDA Zero Page		2 3		% ~ 1 ~ ~ ~ % ~ */	function(){LDA(ZPG)},
/* A6 LDX Zero Page		2 3		% ~ 1 ~ ~ ~ % ~ */	function(){LDX(ZPG)},
/* A7 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* A8 TAY Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(YIR=ACC)},
/* A9 LDA Immediate		2 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(ACC=IMB())},
/* AA TAX Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(XIR=ACC)},
/* AB *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* AC LDY Absolute		3 4		% ~ 1 ~ ~ ~ % ~ */	function(){LDY(ABS)},
/* AD LDA Absolute		3 4		% ~ 1 ~ ~ ~ % ~ */	function(){LDA(ABS)},
/* AE LDX Absolute		3 4		% ~ 1 ~ ~ ~ % ~ */	function(){LDX(ABS)},
/* AF *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* B0 BCS Relative		2 2 **	~ ~ 1 ~ ~ ~ ~ ~ */	function(){BST(FLC)},
/* B1 LDA (Indirect),Y	2 5 *	% ~ 1 ~ ~ ~ % ~ */	function(){LDA(IDY)},
/* B2 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* B3 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* B4 LDY Zero Page,X	2 4		% ~ 1 ~ ~ ~ % ~ */	function(){LDY(ZPX)},
/* B5 LDA Zero Page,X	2 4		% ~ 1 ~ ~ ~ % ~ */	function(){LDA(ZPX)},
/* B6 LDX Zero Page,Y	2 4		% ~ 1 ~ ~ ~ % ~ */	function(){LDX(ZPY)},
/* B7 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* B8 CLV Implied		1 2		~ % 1 ~ ~ ~ ~ ~ */	function(){CLR(FLV)},
/* B9 LDA Absolute,Y	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){LDA(ABY)},
/* BA TSX Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(XIR=SPR)},
/* BB *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* BC LDY Absolute,X	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){LDY(ABX)},
/* BD LDA Absolute,X	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){LDA(ABX)},
/* BE LDX Absolute,Y	3 4 *	% ~ 1 ~ ~ ~ % ~ */	function(){LDX(ABY)},
/* BF *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* C0 CPY Immediate		2 2		% ~ 1 ~ ~ ~ % % */	function(){CPY(IMM)},
/* C1 CMP (Indirect,X)	2 6		% ~ 1 ~ ~ ~ % % */	function(){CMP(XID)},
/* C2 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* C3 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* C4 CPY Zero Page		2 3		% ~ 1 ~ ~ ~ % % */	function(){CPY(ZPG)},
/* C5 CMP Zero Page		2 3		% ~ 1 ~ ~ ~ % % */	function(){CMP(ZPG)},
/* C6 DEC Zero Page		2 5		% ~ 1 ~ ~ ~ % ~ */	function(){DEC(ZPG)},
/* C7 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* C8 INY Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(YIR=++YIR&BYT)},
/* C9 CMP Immediate		2 2		% ~ 1 ~ ~ ~ % % */	function(){CMP(IMM)},
/* CA DEX Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(XIR=--XIR&BYT)},
/* CB *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* CC CPY Absolute		3 4		% ~ 1 ~ ~ ~ % % */	function(){CPY(ABS)},
/* CD CMP Absolute		3 4		% ~ 1 ~ ~ ~ % % */	function(){CMP(ABS)},
/* CE DEC Absolute		3 6		% ~ 1 ~ ~ ~ % ~ */	function(){DEC(ABS)},
/* CF *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* D0 BNE Relative		2 2 **	~ ~ 1 ~ ~ ~ ~ ~ */	function(){BCL(FLZ)},
/* D1 CMP (Indirect),Y	2 5 *	% ~ 1 ~ ~ ~ % % */	function(){CMP(IDY)},
/* D2 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* D3 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* D4 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* D5 CMP Zero Page,X	2 4		% ~ 1 ~ ~ ~ % % */	function(){CMP(ZPX)},
/* D6 DEC Zero Page,X	2 6		% ~ 1 ~ ~ ~ % ~ */	function(){DEC(ZPX)},
/* D7 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* D8 CLD Implied		1 2		~ ~ 1 ~ % ~ ~ ~ */	CLD,
/* D9 CMP Absolute,Y	3 4 *	% ~ 1 ~ ~ ~ % % */	function(){CMP(ABY)},
/* DA *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* DB *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* DC *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* DD CMP Absolute,X	3 4 *	% ~ 1 ~ ~ ~ % % */	function(){CMP(ABX)},
/* DE DEC Absolute,X	3 7		% ~ 1 ~ ~ ~ % ~ */	function(){DEC(ABX)},
/* DF *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* E0 CPX Immediate		2 2		% ~ 1 ~ ~ ~ % % */	function(){CPX(IMM)},
/* E1 SBC (Indirect,X)	2 6		% % 1 ~ ~ ~ % % */	function(){SBC(XID)},
/* E2 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* E3 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* E4 CPX Zero Page		2 3		% ~ 1 ~ ~ ~ % % */	function(){CPX(ZPG)},
/* E5 SBC Zero Page		2 3		% % 1 ~ ~ ~ % % */	function(){SBC(ZPG)},
/* E6 INC Zero Page		2 5		% ~ 1 ~ ~ ~ % ~ */	function(){INC(ZPG)},
/* E7 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* E8 INX Implied		1 2		% ~ 1 ~ ~ ~ % ~ */	function(){FNZ(XIR=++XIR&BYT)},
/* E9 SBC Immediate		2 2		% % 1 ~ ~ ~ % % */	function(){SBC(IMM)},
/* EA NOP Implied		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	NOP,
/* EB *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* EC CPX Absolute		3 4		% ~ 1 ~ ~ ~ % % */	function(){CPX(ABS)},
/* ED SBC Absolute		3 4		% % 1 ~ ~ ~ % % */	function(){SBC(ABS)},
/* EE INC Absolute		3 6		% ~ 1 ~ ~ ~ % ~ */	function(){INC(ABS)},
/* EF *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* F0 BEQ Relative		2 2 **	~ ~ 1 ~ ~ ~ ~ ~ */	function(){BST(FLZ)},
/* F1 SBC (Indirect),Y	2 5 *	% % 1 ~ ~ ~ % % */	function(){SBC(IDY)},
/* F2 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* F3 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* F4 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* F5 SBC Zero Page,X	2 4		% % 1 ~ ~ ~ % % */	function(){SBC(ZPX)},
/* F6 INC Zero Page,X	2 6		% ~ 1 ~ ~ ~ % ~ */	function(){INC(ZPX)},
/* F7 *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* F8 SED Implied		1 2		~ ~ 1 ~ % ~ ~ ~ */	SED,
/* F9 SBC Absolute,Y	3 4 *	% % 1 ~ ~ ~ % % */	function(){SBC(ABY)},
/* FA *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* FB *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* FC *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P,
/* FD SBC Absolute,X	3 4 *	% % 1 ~ ~ ~ % % */	function(){SBC(ABX)},
/* FE INC Absolute,X	3 7		% ~ 1 ~ ~ ~ % ~ */	function(){INC(ABX)},
/* FF *** INVALID		1 2		~ ~ 1 ~ ~ ~ ~ ~ */	N0P
];
//  *	Add 1 if page boundary crossed
// **	Add 1 if branch occurs to same page. Add 2 if branch occurs to different page

// "Main"

// Processor "Signals" - Variations on a theme!

// FCH = FetCH; DCD = DeCoDe; EXE = EXEcute; FDE = Fetch, Decode, Execute cycle; STP = STeP (No. of Instructions); RUN = RUN (No. of cycles)

FCH	= function(){OPC=IMB();PCR&=WRD}		// FCH = FetCH
DCD	= function(){EXC=TOK[OPC]}				// DCD = DeCoDe
EXE	= function(){INS[OPC]();CLK+=TIK[OPC]}	// EXE = EXEcute
FDE	= function(){FCH();DCD();EXE()}			// FDE = Fetch, Decode, Execute cycle
STP	= function(NIN){while(NIN-->0)FDE()}	// STP = STeP (No. of Instructions)
RUN	= function(NCY){OPC=IMB();PCR&=WRD;EXC=TOK[OPC];INS[OPC]();CLK+=TIK[OPC];PCR-ERV?NUL:fHelpWin(LDB(NUL),IMW(FLC))}	//  RUN = RUN (No. of cycles)
RUN = function(){OPC=IMB();PCR&=WRD;CYC=CLK;EXC=TOK[OPC];INS[OPC]();CLK+=TIK[OPC];fIOPoll(CLK-CYC);PCR-ERV?NUL:fHelpWin(LDB(NUL),IMW(FLC))}	//  RUN = RUN (No. of cycles)

RST	= function()							// RST = ReSeT
{
	BRQ = CLK = 0;
	ACC = XIR = YIR = 0;
	FLG = FLR | FLD;
	PCR = IMW(RSV);
	SPR = BYT;
	CLD();					// Not just Decimal flag, but ADC & SBC function pointers
}

// Processor Initialisation and primitives / debug; OCD = OpCode Data

OCD =	"7600035032200460AD0004602C000C706600335042204460AD0004602C000C706600035032203460AD0004602C000C706600035042205460AD0004602C000C70" +
		"0600333020204440A6004440252005002620333022204440AD0044402C20CCC02600335022204460AD0004602C000C702600335022204460AD0004602C000C70";
/*
DATA SCHEME:

	128 bytes for Total cycles (T) (256 nibbles)
	151 bytes for Macro numbers + Instruction codes (MI)
	 76 bytes for Addressing modes (A) (151 nibbles) - 0.5 bytes / 1 nibble wasted
	 28 bytes for Flag patterns (F) (56 nibbles)
	383 bytes total (512 bytes using base 64 encoding)
	355 bytes excluding Flag patterns for documentary / debug purposes (476 bytes using base 64 encoding)

	"8BE3E3C3656343E3C3CAE3E3C34EE3E3C35DC2C7C2E8674268C7C2E8C8C2C2E86DC2C2E86AD8D8E16458615CD8E1CCD8D8E150D8D8E16BC1C1E966C1695CC1E9CDC1C1E96FC1C1E9F0F2F0F15776F2F0F1C4F0F2F0F178F077F060DE5FE0DEDF745E73E0DEDFC5DEE0DEDF51DE75E0DEDFD4D2D4D2D55BD256D4D2D5C9D2D2D58FD2D2D5D3ECD3ECD95AECA2D3ECD9C6ECECD9AEECECD9";
	"1744132BB98551DCCB7444132BBB98551DCC1744132BBB98551DCC1744132ABB98551DCC744411BBB985561D1C373444131BBB985561D1CCD37444131BBB98551DCC37444131BBB98551DCC";
	"96700080004001325777666666600666706006A77A09132000666606";
	"202124283460A2A3E2E3EF";

	MNM="ADCANDASLBCCBCSBEQBITBMIBNEBPLBRKBVCBVSCLCCLDCLICLVCMPCPXCPYDECDEXDEYEORINCINXINYJMPJSRLDALDXLDYLSRNOPORAPHAPHPPLAPLPROLRORRTIRTSSBCSECSEDSEISTASTXSTYTAXTAYTSXTXATXSTYA";
	(168 bytes)
	ANM="INVIMPACCIMMZPGZPXZPYXIDIDYBRAINDABSABXABY";
	(42 bytes)
	"Invalid`Implied`Accumulator`Immediate`Zero Page`Zero Page,X`Zero Page,Y`(Indirect,X)`(Indirect),Y`Relative`(Indirect)`Absolute`Absolute,X`Absolute,Y";
	(148 bytes)
*/
TIK	= [];			// TIK = TIcKs (cycles)
TOK	= [];			// TOK = TOcKs (extra cycles)

BPI	= [];			// Bytes Per Instruction

B2D	= [];			// Binary to Decimal fast conversion tables
D2B	= [];			// Decimal to Binary fast conversion tables

BLD	= function()	// This builds the BCD and cycle tables and will build the instruction set at a later date for optimum efficiency
{
	for (var r, c, i = 0; i <= BYT; ++i ) {
		c = parseInt(OCD.charAt(i), 16); TIK [i] = c & 0x07; TOK [i] = c & 8;
		if (TIK [i]) { } else { TIK [i] = 2; TOK [i] = 0; BPI [i] = 1; }
		r = i >> 4; c = i &0x0F; B2D [i] = r * 10 + c;
		if (i < 100) { r = Math.floor(i / 10); c = i % 10; D2B [i] = r << 4 | c; } }
}

INIT	= function(){BLD();RST()}

// The fLog function can be deleted for compacting if logging is disabled (LOG = false)

fLog	= function(s){if(LOG)alert(s)}

/*
TODO:

void ADC(temp)
{
	if (!p.d) {
		tempw = a + temp + (p.c ? 1 : 0);
		p.v = !((a ^ temp) & 0x80) && ((a ^ tempw) & 0x80);
		a = tempw & 0xFF;
		p.c = tempw & 0x0100;
		setzn(a); }
	else {
		ah = 0;
		p.z = p.n = 0;
		tempb = a + temp + (p.c ? 1 : 0);
		if (!tempb) p.z = 1;
		al = (a & 0x0F) + (temp & 0x0F) + (p.c ? 1 : 0);
		if (al > 9) {
			al -= 10;
			al &= 0x0F;
			ah = 1; }
		ah += (a >> 4) + (temp >> 4);
		if (ah & 0x08) p.n = 1;
		p.v = (((ah << 4) ^ a) & 0x80) && !((a ^ temp) & 0x80);
		p.c = 0;
		if (ah > 9) {
			p.c = 1;
			ah -= 10;
			ah &= 0x0F; }
		a = (al & 0x0F) | (ah << 4); }
}

DAD	= function(AIR){
var ah=0,al,tb=ACC+AIR+(FLG&FLC);
FLG&=F_N&F_V&F_Z;
if(!tb)FLG|=FLZ;
al=(ACC&0x0F)+(AIR&0x0F)+(FLG&FLC);
if(al>9){al-=10;al&=0x0F;ah=1}
ah+=(ACC>>4)+(AIR>>4);
if(ah&0x08)FLG|=FLN;
if((((ah<<4)^ACC)&0x80)&&!((ACC^AIR)&0x80))FLG|=FLV;
FLG&=F_C;
if(ah>9){FLG|=FLC;ah-=10;ah&=0x0F}
ACC=(al&0x0F)|(ah<<4)}

void SBC(temp)
{
	if (!p.d) {
		tempw = a - (temp + (p.c ? 0 : 1));
		tempv = (int16_t)a - (int16_t)(temp + (p.c ? 0 : 1));
		p.v = ((a ^ temp) & 0x80) && ((a ^ tempw) & 0x80);
		p.c = tempv >= 0;
		a = tempw & 0xFF;
		setzn(a); }
	else {
		hc = 0;
		p.z = p.n = 0;
		tempb = a - temp - (p.c ? 0 : 1);
		if (!(tempb)) p.z = 1;
		al = (a & 0x0F) - (temp & 0x0F) - (p.c ? 0 : 1);
		if (al & 0x10) {
			al -= 6;
			al &= 0x0F;
			hc = 1; }
		ah = (a >> 4) - (temp >> 4);
		if (hc) ah--;
		if ((a - (temp + ((p.c) ? 0 : 1))) & 0x80) p.n = 1;
		p.v = ((a ^ temp) & 0x80) && ((a ^ tempb) & 0x80);
		p.c = 1;
		if (ah & 0x10) {
			p.c = 0;
			ah -= 6;
			ah &= 0x0F; }
		a = (al & 0x0F) | ((ah & 0x0F) << 4); }
}

DSB	= function(AIR){
var ah,al,hc=0,c=FLG&FLC?0:1,tb=ACC-AIR-c;
FLG&=F_N&F_V&F_Z;
if(!tb)FLG|=FLZ;
al=(ACC&0x0F)-(AIR&0x0F)-c;
if(al&0x10){al-=6;al&=0x0F;hc=1}
ah=(ACC>>4)-(AIR>>4);
if(hc)ah--;
if((ACC-(AIR+c))&0x80)FLG|=FLN;
if(((ACC^AIR)&0x80)&&((ACC^tb)&0x80))FLG|=FLV;
FLG|=FLC;
if(ah&0x10){FLG&=F_C;ah-=6;ah&=0x0F}
ACC=(al&0x0F)|((ah&0x0F)<<4)}

*/
