CPU Instruction Cycle Simulator — automated test results
Run: node tests.js   (tests the real simulator core in script.js)

| # | Test | Input | Expected | Actual | Result |
|---|------|-------|----------|--------|--------|
| T01 | Fetch micro-steps of LOAD (MAR, MDR, IR, PC) | LOAD R0, 10 / HALT | {"marAfter2":0,"mdr":"LOAD R0, 10","mdrKind":"instr","ir":"LOAD R0, 10","pcAfter5":1} | {"marAfter2":0,"mdr":"LOAD R0, 10","mdrKind":"instr","ir":"LOAD R0, 10","pcAfter5":1} | PASS |
| T01 | LOAD execute result (R0 = 10) | LOAD R0, 10 / HALT | 10 | 10 | PASS |
| T02 | Register-to-register MOV | LOAD R0, 42 / MOV R1, R0 / HALT | {"R1":42,"R0":42} | {"R1":42,"R0":42} | PASS |
| T03 | ADD two registers | LOAD R0,10 / LOAD R1,5 / ADD R0,R1 / HALT | {"R0":15,"Z":false,"N":false,"C":false,"V":false} | {"R0":15,"Z":false,"N":false,"C":false,"V":false} | PASS |
| T04 | SUB two registers (positive result) | LOAD R0,40 / LOAD R1,25 / SUB R0,R1 / HALT | {"R0":15,"N":false} | {"R0":15,"N":false} | PASS |
| T05 | SUB with negative result (8-bit two’s complement) | LOAD R0,5 / LOAD R1,10 / SUB R0,R1 / HALT | {"stored":251,"signed":-5,"N":true,"C":false} | {"stored":251,"signed":-5,"N":true,"C":false} | PASS |
| T06 | MUL two registers | LOAD R0,7 / LOAD R1,6 / MUL R0,R1 / HALT | {"R0":42,"Z":false} | {"R0":42,"Z":false} | PASS |
| T07 | STORE then READ (data-memory round trip) | LOAD R0,15 / STORE R0,100 / READ R2,100 / HALT | {"mem100":15,"R2":15,"writes":1,"reads":1} | {"mem100":15,"R2":15,"writes":1,"reads":1} | PASS |
| T08 | Required sample program final state | LOAD R0, 10 / LOAD R1, 5 / ADD R0, R1 / STORE R0, 100 / READ R2, 100 / HALT | {"R0":15,"R1":5,"R2":15,"mem100":15,"status":"halted"} | {"R0":15,"R1":5,"R2":15,"mem100":15,"status":"halted"} | PASS |
| T09 | Unconditional JMP skips an instruction | LOAD R0,1 / JMP 3 / LOAD R0,99 / HALT | {"R0":1,"executed":3} | {"R0":1,"executed":3} | PASS |
| T10 | Conditional jump JZ taken (Z = 1) | LOAD R0,5 / LOAD R1,5 / CMP / JZ 5 / LOAD R2,99 / HALT | {"R2":0,"executed":5,"halted":true} | {"R2":0,"executed":5,"halted":true} | PASS |
| T11 | Conditional jump JZ not taken (Z = 0) | LOAD R0,10 / LOAD R1,20 / CMP / JZ 5 / LOAD R2,99 / HALT | {"R2":99,"executed":6,"halted":true} | {"R2":99,"executed":6,"halted":true} | PASS |
| T12 | CMP updates flags (10 < 20: N=1, Z=0) | LOAD R0,10 / LOAD R1,20 / CMP R0,R1 / HALT | {"Z":false,"N":true,"R0":10} | {"Z":false,"N":true,"R0":10} | PASS |
| T13 | HALT stops execution; further stepping is a no-op | LOAD R0,1 / HALT / LOAD R0,99 | {"status":"halted","R0":1,"stepRefused":true} | {"status":"halted","R0":1,"stepRefused":true} | PASS |
| T14 | Invalid opcode rejected with line number | FOO R0 | ok=false, error line 1 mentions "unknown opcode" | true | PASS |
| T15 | Invalid register operand rejected | ADD R0, R4 | ok=false, error mentions invalid register R4 | true | PASS |
| T16 | Out-of-range jump target rejected | JMP 5 (1-instruction program) | ok=false, error mentions out of range | true | PASS |
| T17 | Illegal data-memory address rejected | STORE R0, 300 | ok=false, error mentions valid range 0 to 255 | true | PASS |
| T18 | Program ending without HALT reports an error | LOAD R0, 1 | status=error, message: Fetch failed: PC = 1 is outside the program (0 to 0) — the program end... | true | PASS |
| T19 | Reset restores initial state (regs, memory, flags, counters) | run then reset | {"dirtyR0":3,"R0":0,"R1":7,"mem50":0,"count":0,"status":"idle","flags":{"Z":false,"N":false,"C":false,"V":false}} | {"dirtyR0":3,"R0":0,"R1":7,"mem50":0,"count":0,"status":"idle","flags":{"Z":false,"N":false,"C":false,"V":false}} | PASS |
| T19 | After reset the program runs again to the same result | run again after reset | {"R0":3,"mem50":3,"status":"halted"} | {"R0":3,"mem50":3,"status":"halted"} | PASS |
| T20 | Step Stage walks Fetch, then Decode, then Execute | LOAD R0,10 / HALT | {"after1":"decode","after2":"execute","after3":{"stage":"fetch","cycles":1,"R0":10}} | {"after1":"decode","after2":"execute","after3":{"stage":"fetch","cycles":1,"R0":10}} | PASS |
| T21 | PC advances sequentially (0→1→2→3) | LOAD / LOAD / HALT | {"pcs":[1,2,3],"status":"halted"} | {"pcs":[1,2,3],"status":"halted"} | PASS |
| T22 | 8-bit signed overflow: 100 + 100 = 200 (V=1, N=1, C=0) | LOAD R0,100 / LOAD R1,100 / ADD / HALT | {"R0":200,"signed":-56,"Z":false,"N":true,"C":false,"V":true} | {"R0":200,"signed":-56,"Z":false,"N":true,"C":false,"V":true} | PASS |
| T23 | 8-bit carry: 200 + 100 wraps to 44 with C=1 | LOAD R0,200 / LOAD R1,100 / ADD / HALT | {"R0":44,"C":true,"V":false} | {"R0":44,"C":true,"V":false} | PASS |
| T24 | 16-bit mode: 400 + 400 = 800 without flags | LOAD R0,400 / LOAD R1,400 / ADD / HALT (16-bit) | {"R0":800,"C":false,"V":false,"N":false} | {"R0":800,"C":false,"V":false,"N":false} | PASS |
| T25 | Unbounded mode keeps negative integers | LOAD R0,-5 / LOAD R1,3 / SUB R0,R1 / HALT (unbounded) | {"R0":-8,"N":true,"Z":false} | {"R0":-8,"N":true,"Z":false} | PASS |
| T26 | Infinite loop stopped by instruction limit | JMP 0 | status=error, error=Instruction limit exceeded (10000 instructions) — the progra... | true | PASS |
| T27 | Initial PC / register / memory configuration respected | initialPC=1, R3=9, M[200]=7 | {"R0":0,"R2":9,"R1":7,"executed":3} | {"R0":0,"R2":9,"R1":7,"executed":3} | PASS |
| T28 | Running/stepping after HALT is a safe no-op | run twice, then step | {"secondRunStillHalted":true,"stepRefused":true,"executed":2} | {"secondRunStillHalted":true,"stepRefused":true,"executed":2} | PASS |
| T29 | JZ uses the real flag state (LOAD does not set Z) | LOAD R0,0 / JZ 3 / LOAD R1,9 / HALT | {"R1":9,"executed":4,"halted":true} | {"R1":9,"executed":4,"halted":true} | PASS |
| T30 | Immediate out of range for 8-bit rejected | LOAD R0, 300 (8-bit) | ok=false, error mentions out of range | true | PASS |

**Total: 32 checks — 32 passed, 0 failed.**
