# Presentation Outline & Viva Preparation

**Project:** Interactive CPU Instruction Cycle Simulator: Fetch, Decode, Execute
**Subject:** Computer Organization and Architecture (COA–CO5 Micro Project)
**Duration target:** 5–7 minutes demonstration + viva questions

> **Note to student:** practice the demo script below once or twice with a timer. Everything in the script is something the simulator genuinely does — nothing here needs to be faked. Fill in your name/PRN on the title slide.

---

## Part A — Demonstration Script (5–7 minutes)

### 0. Setup (before you start)

- Open `index.html` in the browser (Chrome/Edge). Have the basic sample program loaded (it is the default).
- Close other tabs; use a readable window size; zoom the browser (Ctrl + +) if the room projector is small.
- Optional second window: a terminal already showing `node tests.js` output (32/32 PASS) — powerful 10-second evidence of correctness.

### 1. Introduction — 30 seconds

> "Good morning. My micro project is an **Interactive CPU Instruction Cycle Simulator** built with plain HTML, CSS, and JavaScript — no libraries, no backend. Every processor, from a microcontroller to a laptop CPU, runs the same fundamental loop: **fetch** an instruction from memory, **decode** it, and **execute** it. My simulator makes that loop visible step by step, so we can watch the PC, MAR, MDR, IR, ALU, and Control Unit working together."

### 2. Architecture walkthrough — 45 seconds

Point at the block diagram (Section 3 of the page):

> "This is the CPU model: the Program Counter, MAR and MDR as the memory interface, the Instruction Register, the four general-purpose registers R0 to R3, the ALU, and the Control Unit. Notice memory is split — **instruction memory** on one side, **data memory** (256 addresses, 0–255) on the other — so an instruction fetch is never confused with a data access. During execution these paths light up: blue for Fetch, amber for Decode, green for Execute."

### 3. The sample program — 30 seconds

Scroll to the program editor:

> "Here is the sample program: load 10 into R0, load 5 into R1, add them, store the result at data memory address 100, read it back into R2, and halt. I'll now execute it — but not all at once. First, one **stage** at a time."

### 4. FETCH, stage by stage — 60 seconds

Press **Step Stage** once:

> "The Fetch stage has begun. The log shows the micro-steps. First, the **PC holds 0** — the index of the next instruction. The PC value is copied into the **MAR** — the address register. Instruction memory is read at that address and the instruction enters the **MDR** — you can see MDR is marked 'instruction' to distinguish it from data. The MDR contents are copied into the **IR** — the instruction is now inside the CPU. And finally the **PC increments to 1**, pointing at the *next* instruction — unless a jump changes it later."

(Each further Step Stage press walks Decode and Execute; the register panel and diagram flash as each value moves.)

### 5. DECODE and EXECUTE — 60 seconds

After the next Step Stage:

> "Decode: the **Control Unit** reads the IR — opcode LOAD, destination R0, immediate 10 — and you can see the simplified control signals it will assert, like `RegWrite[R0]`. Decode changes nothing; it only decides."

Then:

> "Execute: the immediate 10 passes through the ALU bus and R0 becomes 10. Now watch the **ADD** — this is the best part. Step to its Execute stage: the ALU panel shows **input A = 10 (R0), input B = 5 (R1), operation ADD, result 15**, and the flags update — Z = 0 because the result is not zero. The result is written back to R0. One instruction, three stages, exactly as in the theory."

### 6. Memory operations and HALT — 45 seconds

Step to the STORE:

> "STORE is a **data** memory access: address 100 goes into the MAR — now marked 'data' — the value 15 goes into the MDR, and memory cell 100 flashes as it is written. READ is the reverse: address into MAR, memory into MDR, then R2 ← 15."

Run to the end (press **Run** or step):

> "Finally HALT — the status pill shows HALTED, and the summary confirms the final state: R0 = 15, R1 = 5, R2 = 15, memory 100 = 15 — exactly the expected result."

### 7. Controls and customization — 45 seconds

> "The controls support every granularity: single micro-step, single stage, single instruction, and continuous Run with **Pause and Resume** — I can even pause mid-cycle. Speed is adjustable. Everything is customizable: I can edit the program — with validation, as you can see if I type an invalid instruction like `FOO R0` — it refuses to run and tells me the line number. I can set the initial PC, initial register values, initial memory, and the arithmetic width: here is the same 100 + 100 in 8-bit mode producing 200 — which is −56 signed — with the **overflow flag V set** and N set; in 16-bit mode it is simply 800 with no flags."

(Optionally load the countdown-loop sample and let it run — a real loop with a taken conditional jump.)

### 8. Correctness evidence — 30 seconds

> "Finally, correctness was not assumed — it was tested. This terminal output is a 32-check automated suite that runs the *same* CPU core the browser runs: every instruction, both jump outcomes, flags in all three arithmetic modes, every validation error, reset, and even an infinite-loop guard. Thirty-two out of thirty-two pass. Thank you — I'm happy to take questions."

**Total: ≈ 5 minutes 30 seconds, leaving room for the loop demo or a slower pace.**

---

## Part B — Slide-by-Slide Outline

*(Make these slides in PowerPoint/Google Slides; screenshots come from the checklist in `project-report.md` §20.)*

| Slide | Title | Content |
|---|---|---|
| 1 | Title | Project title; your name, PRN, class; Sanjivani University; subject COA, topic: CPU Instruction Cycle; guide's name |
| 2 | Problem & Aim | Instruction cycle is invisible in real hardware; aim: make it observable, step by step, in the browser |
| 3 | What is the Instruction Cycle? | Diagram: Fetch → Decode → Execute → (repeat); "the heartbeat of every CPU" |
| 4 | CPU Components | PC, IR, MAR, MDR, R0–R3, ALU, Control Unit, flags, instruction memory vs data memory — one line each |
| 5 | Architecture | Screenshot S1/S2 of the simulator's block diagram; note the memory separation |
| 6 | Instruction Set | The 11 instructions with formats (table); jump targets are 0-based indices; addresses 0–255 |
| 7 | Fetch in 5 Micro-steps | PC → MAR → MDR → IR → PC+1, with the register-panel screenshot |
| 8 | Decode | Screenshot S3: opcode, operands, components, control signals; "decode decides, doesn't change" |
| 9 | Execute | Screenshot S4: ALU inputs/op/result/flags; STORE/READ memory path; jumps rewrite PC; HALT |
| 10 | Live Demo | (Switch to the browser — this slide stays on screen before you switch) |
| 11 | Customization & Validation | Editable program/PC/registers/memory/width/speed; line-numbered errors; 8-bit overflow demo screenshot |
| 12 | Testing | Screenshot S13 of `node tests.js`: 32/32 pass; same core runs in browser and tests |
| 13 | Limitations & Future Work | Simplified model (no pipeline/cache/interrupts); future: pipelining, more instructions, addressing modes |
| 14 | Conclusion | Cycle made visible; deterministic; tested; original vanilla-JS implementation |
| 15 | Thank You / Questions | Contact/PRN line |

---

## Part C — How the Components Work Together

*(The explanation examiners most often probe — memorize this flow.)*

**The cast:** PC (where the next instruction is), MAR (address being accessed), MDR (data travelling to/from memory), IR (current instruction), Control Unit (decides), ALU (computes), registers (hold values), flags (record results).

1. The **PC** holds the index of the next instruction. It is the *only* register that knows where execution is going next.
2. In Fetch, PC's value is copied into the **MAR**, because the CPU can only address memory through the MAR — the PC itself never talks to memory directly.
3. Memory is read at the MAR address; the instruction word arrives in the **MDR** — the CPU's only doorway for data coming from memory.
4. The MDR contents move into the **IR**. Now the Control Unit has a stable copy of the instruction to work on, and the PC is already free to point at the next instruction (PC+1).
5. In Decode, the **Control Unit** reads the IR's opcode and operands and generates control signals — which ALU operation, which register to write, whether memory is read or written, where the next PC comes from.
6. In Execute, those signals fire: the **ALU** takes its inputs from the register file, computes, sets the flags, and the result is written back; or memory is accessed again through MAR/MDR for STORE/READ; or the PC is overwritten with a jump target.
7. The cycle repeats: the new PC goes to the MAR, and the next instruction is fetched.

**Key insight to state:** the PC, MAR, MDR, and IR form the *instruction pipeline into the CPU*, while the registers, ALU, and flags form the *data path*; the Control Unit is the conductor connecting them. The simulator shows this by highlighting the exact data path active at each micro-step.

---

## Part D — Instruction Cycle vs. Clock Cycle

*(A classic viva question — answer in three sentences.)*

- A **clock cycle** is one tick of the processor's clock — the smallest unit of time in a synchronous CPU, typically enough for one register transfer or one simple gate-level step.
- An **instruction cycle** is the complete fetch–decode–execute of **one instruction**, and therefore takes **multiple clock cycles** (in a classic multi-cycle CPU, roughly 3–5; in this simulator, each visible micro-step corresponds to about one clock cycle of a multi-cycle machine).
- A modern pipelined CPU *overlaps* the stages of successive instructions so that, in the best case, several instructions complete every clock cycle — but the stages themselves are exactly the ones demonstrated here.

---

## Part E — How the Simulator Is Simplified vs. a Real Processor

*(Honest limitations — examiners reward knowing these.)*

| Aspect | This simulator | Real processor |
|---|---|---|
| Execution | One instruction at a time, sequential stages | Pipelined: multiple instructions in flight simultaneously |
| Speed | Animated for humans (milliseconds per step) | Billions of instructions per second |
| Memory | Instruction memory + 256-address data memory, no cache | Multi-level caches, virtual memory, byte addressing, buses |
| Encoding | Instructions stored as text, indexed by line | Binary encodings, variable length, alignment rules |
| Control | Simplified named control signals | Microcode/hardwired finite-state machines with thousands of signals |
| Flags/ALU | Z, N, C, V with documented rules; 8/16-bit or unbounded | Full flag sets, shifts, logic ops, FP units, SIMD |
| Extras | None: no interrupts, I/O, DMA, multi-core | All of these, plus power management, branch prediction, out-of-order execution |

**One-sentence version:** "The simulator preserves the *logical model* of the instruction cycle — the registers, the stages, the control flow — while omitting the *performance machinery* of a real CPU, because the goal is understanding, not speed."

---

## Part F — 25 Likely Viva Questions with Answers

**Q1. What is the instruction cycle?**
The repeating sequence of steps a CPU performs for every instruction: fetch it from memory, decode it, execute it, then repeat. It is also called the fetch–decode–execute cycle.

**Q2. What is the role of the Program Counter?**
It holds the address (in this simulator, the index) of the *next* instruction to fetch. It auto-increments during fetch and can be overwritten by a taken jump during execute.

**Q3. Why do we need the MAR if the PC already holds an address?**
The PC holds only instruction addresses. Every memory access — instruction *or* data — must go through the MAR, which is the CPU's memory-addressing register. During a data access (STORE/READ), the address comes from the instruction operand, not the PC.

**Q4. What is the MDR's role, and how does it differ from the IR?**
The MDR is the buffer for anything moving between memory and the CPU — an instruction during fetch, or a data value during STORE/READ. The IR specifically holds the *current instruction* after fetch so decode/execute work on a stable copy.

**Q5. Walk me through the fetch stage.**
(1) PC holds the index of the next instruction. (2) PC → MAR. (3) Instruction memory is read at MAR and the result enters MDR. (4) MDR → IR. (5) PC increments to point at the next sequential instruction.

**Q6. When does the PC increment — before or after execute?**
During fetch, immediately after the instruction is placed in the IR. A jump in the execute stage then *overwrites* this incremented value; otherwise it stands.

**Q7. What does the Control Unit do?**
It reads the IR during decode, determines the operation and operands, and generates the control signals that sequence the execute stage: ALU operation select, register-write enables, memory read/write, and the source of the next PC.

**Q8. What does the ALU do, and which instructions use it?**
It performs arithmetic and comparison: ADD, SUB, MUL, and CMP. LOAD also passes its immediate through the ALU's path (a pass-through) to reach the register.

**Q9. What is the difference between CMP and SUB?**
Both compute A − B in the ALU and update flags. SUB writes the result back to the destination register; CMP updates *only the flags* and leaves registers unchanged.

**Q10. What are status flags, and which ones do you implement?**
Z (zero), N (negative), C (carry), V (overflow). Z/N are always meaningful; C/V are defined in the fixed-width modes. JZ uses Z.

**Q11. Explain the carry and overflow flags in 8-bit mode with an example.**
Carry is *unsigned* overflow: 200 + 100 = 300 exceeds 255, so it wraps to 44 with C = 1. Overflow is *signed* overflow: 100 + 100 = 200 exceeds the signed maximum +127, so the stored 200 reads as −56 with V = 1 — two positive numbers produced a negative result, which is impossible in correct signed arithmetic.

**Q12. How does JZ decide whether to jump?**
It tests the Z flag — the flag's *current* value, set by the most recent flag-updating instruction (e.g., SUB or CMP). If Z = 1, PC ← target; otherwise PC is unchanged and execution continues sequentially.

**Q13. Why does `LOAD R0, 0` followed by `JZ` NOT take the jump in your simulator?**
Because LOAD does not update flags. JZ reads the flag state, not the register. This is a deliberate, documented semantic — and there is a dedicated automated test (T29) proving it.

**Q14. Is your instruction memory the same as your data memory?**
No — they are deliberately separate (a Harvard-style organization at the educational level), so an instruction fetch is visibly distinct from a data access. Both go through MAR/MDR, but the MAR context and MDR kind are displayed differently.

**Q15. What are the address units of your two memories?**
Instruction memory is indexed by whole instructions (0 to N−1). Data memory has 256 individually addressable cells (0–255).

**Q16. What happens if the program ends without HALT?**
The next fetch fails because the PC is outside the program; the simulator reports a clear error ("Fetch failed: PC outside the program") and stops — it never invents instructions.

**Q17. What happens on an invalid instruction?**
It is rejected at parse time, before execution, with the line number and the reason (unknown opcode, bad register, out-of-range immediate, illegal address, bad jump target). Execution is blocked until fixed — nothing invalid is ever silently executed.

**Q18. How do you prevent infinite loops like `JMP 0`?**
A safety limit of 10 000 executed instructions; if exceeded, the simulator halts with "Instruction limit exceeded". There is an automated test for exactly this.

**Q19. What is the difference between your Step Stage and Step Instruction buttons?**
Step Stage advances one stage (Fetch, Decode, or Execute) of the current instruction; Step Instruction advances one complete cycle — all remaining stages of the current instruction. (There is also finer micro-step granularity internally.)

**Q20. How does Pause behave if pressed mid-instruction?**
The run loop simply stops scheduling the next step; the CPU state stays exactly where it was — even mid-cycle — and Resume continues from that exact micro-step. No state is rolled back or duplicated.

**Q21. What does Reset do?**
Restores the initial state completely: PC and IR/MAR/MDR cleared to the configured initial values, registers and data memory restored to their initial contents, flags cleared, counters zeroed, and the status returned to idle. It was tested (T19) including re-running after reset.

**Q22. Why did you write the CPU core without DOM code?**
So the same core can run in the browser *and* inside the Node.js test suite. That way the automated tests exercise exactly the logic that is demonstrated — there is no untested copy of the CPU.

**Q23. How do you know your simulator is correct — not just that it looks right?**
Thirty-two automated checks run the real core: every instruction, both jump outcomes, flag behaviour in all three arithmetic modes, every validation path, reset, PC sequencing, HALT semantics, and the infinite-loop guard — 32/32 pass. The required sample program's final state is verified as part of the suite (T08).

**Q24. What is the difference between an instruction cycle and a clock cycle?**
See Part D: a clock cycle is one tick (one register-transfer's worth of time); an instruction cycle is one complete fetch–decode–execute and spans multiple clock cycles.

**Q25. Where is your simulator simplified compared to a real CPU?**
See Part E: no pipelining, cache, interrupts, I/O, or microcode; text instructions instead of binary encodings; a small register set and instruction set; sequential animated stages. The *logical model* is faithful; the *performance machinery* is deliberately omitted for pedagogy.

**Possible follow-ups to be ready for:** Why is C = 1 on SUB when there is *no* borrow? (It follows the ARM convention: C acts as the NOT of the borrow signal — documented in the Help section.) — Why does MUL set V? (Signed overflow of the product in fixed-width mode.) — What is two's complement? (The encoding where −x is stored as 2ⁿ − x; e.g., −5 is 251 in 8 bits — visible in the simulator's signed/unsigned columns.)

---

## Part G — Quick Reference Card (memorize)

| Thing | Value |
|---|---|
| Instructions | 11: LOAD, MOV, ADD, SUB, MUL, STORE, READ, JMP, JZ, CMP, HALT |
| Registers | R0–R3 + PC, IR, MAR, MDR |
| Flags | Z, N, C, V (C/V in fixed-width modes only) |
| Data memory | 256 addresses (0–255) |
| Instruction memory | the program, indexed 0…N−1 |
| Widths | 8-bit, 16-bit, unbounded |
| Fetch micro-steps | PC → MAR → MDR → IR → PC+1 |
| Safety limit | 10 000 instructions |
| Automated tests | 32 checks, 32 pass (`node tests.js`) |
| Tech | HTML5 + CSS3 + vanilla JavaScript, zero dependencies |
| Sample result | R0=15, R1=5, R2=15, M[100]=15, HALTED |
