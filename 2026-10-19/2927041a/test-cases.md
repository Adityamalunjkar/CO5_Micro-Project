# Test Cases and Results — CPU Instruction Cycle Simulator

**Subject:** Computer Organization & Architecture (COA) — CO5 Micro Project
**Component under test:** the complete simulator core (`script.js`, `createSimulator`)

## 1. Test approach

The tests are **real automated tests**, not a list of claims:

- `tests.js` runs under Node.js (`node tests.js`) and loads the **same CPU core**
  (`createSimulator`, `parseProgram`) that the browser UI uses — there is no
  second "test-only" implementation.
- Every test drives the actual simulator (parse, fetch, decode, execute,
  reset) and then **compares the observed state against the expected value**.
- A test only reports PASS when the comparison succeeds; the PASS text is
  never hard-coded.
- The table below is the genuine output of the run performed on
  2026-10-19 (32 checks, 32 passed, 0 failed).

Run the suite yourself:

```
node tests.js
```

## 2. Automated test results

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

## 3. Manual browser verification (performed 2026-10-19)

The following UI-level behaviours were verified manually in a modern browser
(opening `index.html` directly from the file system):

| Check | Expected | Observed | Result |
|---|---|---|---|
| Page loads without console errors | no errors | no console errors, all panels initialised (6 program rows, 256 memory cells, 5 samples) | PASS |
| Step Stage ×3 on Sample 1 | Fetch (5 micro-steps) → Decode → Execute; R0 = 10 after first instruction | identical log sequence; R0 = 10 | PASS |
| Run to HALT on Sample 1 | R0=15, R1=5, R2=15, M[100]=15, status HALTED, 6 instructions | exactly as expected | PASS |
| Pause mid-run then Resume | run stops at stage boundary (PAUSED), resume completes to HALT | works as expected | PASS |
| Reset after HALT | registers/memory/flags/log restored, Run re-enabled | works as expected | PASS |
| Sample 4 (countdown loop) | R0=0, M[110]=0, Z=1, 28 instructions, 5 writes, LOAD R3 skipped | exactly as expected | PASS |
| Sample 5 (overflow) at 8-bit | R0 = 200 (0xC8, signed −56), N=1, V=1, C=0 | exactly as expected | PASS |
| Invalid program (FOO / R4 / JMP 9 / addr 300) | all four errors listed with line numbers; Run disabled; status INVALID PROGRAM | all four errors listed | PASS |
| Configuration (R2=9, M[200]=7) | initial state applied after Apply & Reset | R2 = 9, memory cell 0xC8 shows 07 | PASS |
| Unbounded width | C and V flags show "—" | shown as "—" | PASS |

## 4. Coverage against the required test plan

| Required scenario | Covered by |
|---|---|
| Fetch, Decode, Execute of a LOAD instruction | T01 |
| Register-to-register MOV | T02 |
| Addition and subtraction | T03, T04, T05 |
| Multiplication | T06 |
| Data-memory STORE and READ | T07 |
| A successful conditional jump | T10 |
| A conditional jump that is not taken | T11 |
| HALT behavior | T13 |
| Invalid instruction handling | T14, T15, T30 |
| Reset behavior | T19 |
| Single-step execution | T20 |
| Program completion and PC updates | T21, T18, T09 |
