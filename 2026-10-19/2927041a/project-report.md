# Interactive CPU Instruction Cycle Simulator: Fetch, Decode, Execute

**Micro Project Report — Computer Organization and Architecture (COA–CO5)**

---

## 1. Cover Page

<div align="center">

**A MICRO PROJECT REPORT ON**

# Interactive CPU Instruction Cycle Simulator: Fetch, Decode, Execute

**Submitted in partial fulfilment of the requirements of the COA–CO5 Micro Project Assessment**

---

| | |
|---|---|
| **Project Title** | Interactive CPU Instruction Cycle Simulator: Fetch, Decode, Execute |
| **Student Name** | [Student Name] |
| **PRN** | [PRN] |
| **Class / Division** | [Class / Division] — Second Year, Integrated B.Tech CSE |
| **Department** | Department of Computer Science and Engineering |
| **University** | Sanjivani University, Kopargaon, Maharashtra |
| **Subject** | Computer Organization and Architecture (COA) |
| **Topic** | CPU Instruction Cycle (Fetch, Decode, Execute) |
| **Guide / Faculty** | [Faculty Name] |
| **Academic Year** | [Academic Year] |

</div>

> **Note to student:** replace every `[bracketed placeholder]` above (and in the certificate below) with your actual details before submission.

---

## 2. Certificate

> This is to certify that **[Student Name]**, PRN **[PRN]**, a student of **Second Year Integrated B.Tech (Computer Science and Engineering)**, Department of CSE, Sanjivani University, Kopargaon, has successfully completed the micro project titled **"Interactive CPU Instruction Cycle Simulator: Fetch, Decode, Execute"** under my guidance, in partial fulfilment of the requirements of the **COA–CO5 Micro Project Assessment** during the academic year **[Academic Year]****.

Place: Kopargaon
Date: [Date]

| | |
|---|---|
| Signature of Guide: ______________ | Signature of HOD: ______________ |
| Name: [Faculty Name] | Name: [HOD Name] |

> **Note to student:** keep the certificate format exactly as prescribed by your department notice — copy the official wording if it differs, and obtain the real signatures yourself. No signatures are pre-filled here.

---

## 3. Acknowledgement

> I take this opportunity to express my sincere gratitude to my subject guide **[Faculty Name]**, Department of Computer Science and Engineering, Sanjivani University, Kopargaon, for valuable guidance and encouragement throughout this micro project.
>
> I am also thankful to the Head of the Department **[HOD Name]** and the entire CSE department for providing the resources and environment necessary to complete this work, and to my family and friends for their constant support.
>
> — **[Student Name]** ([PRN])

---

## 4. Abstract

The instruction cycle — the repeated sequence of **fetching** an instruction from memory, **decoding** it, and **executing** it — is the foundation of every processor's operation, yet it is difficult to observe because real hardware completes it billions of times per second.

This project delivers an **interactive CPU Instruction Cycle Simulator** built entirely with HTML5, CSS3, and vanilla JavaScript. It models a simplified educational processor containing a Program Counter (PC), Instruction Register (IR), Memory Address Register (MAR), Memory Data Register (MDR), an Arithmetic Logic Unit (ALU), a Control Unit, four general-purpose registers (R0–R3), four status flags (Z, N, C, V), and separate instruction and data memories. The simulator executes an eleven-instruction assembly-like program either one **micro-step**, one **stage** (Fetch / Decode / Execute), or one **full instruction** at a time, or continuously until HALT, while highlighting the active stage, the registers in use, and the data paths involved on an architecture diagram.

All behaviour is deterministic and validated: malformed instructions, illegal memory addresses, out-of-range jump targets, and invalid operands are rejected with line-numbered error messages before execution. A 32-check automated test suite runs the real simulator core (not a mock) and passes 32/32. The required sample program (load 10, load 5, add, store at address 100, read back, halt) reproduces the expected final state exactly: R0 = 15, R1 = 5, R2 = 15, memory[100] = 15, CPU HALTED.

**Keywords:** CPU, instruction cycle, fetch–decode–execute, registers, ALU, control unit, simulator, HTML5, JavaScript.

---

## 5. Introduction to Computer Organization and Architecture

**Computer Organization** refers to *how* the hardware components of a computer are interconnected and how they carry out the specifications of the instruction set — the operational units (registers, ALU, buses, control signals) and their interconnections. **Computer Architecture** refers to *what* the programmer sees: the instruction set, addressing modes, data types, and registers visible to software.

The two meet in the **CPU (Central Processing Unit)**, whose only job is to repeat a simple loop forever:

1. **Fetch** the next instruction from memory.
2. **Decode** it — find out what operation is required.
3. **Execute** it — perform the operation.
4. Repeat.

This loop, called the **instruction cycle** (or fetch–decode–execute cycle), converts a static list of instructions in memory into dynamic computation. Every program — from a "Hello World" to an operating system — is ultimately executed this way, one instruction at a time.

Understanding this cycle requires understanding the components that participate in it: the PC that remembers *where* the next instruction is, the IR that holds *what* the current instruction is, the MAR/MDR pair through which the CPU talks to memory, the ALU that performs computation, and the Control Unit that coordinates everything. Because these events are invisible in real hardware (a modern CPU core completes several instructions per nanosecond), a **simulator** that slows the cycle down and makes every register transfer visible is one of the most effective tools for studying it.

---

## 6. Problem Statement

Students studying the CPU instruction cycle face a specific difficulty: the theory names the components (PC, IR, MAR, MDR, ALU, Control Unit) and describes the fetch–decode–execute sequence, but **no tool available to the student makes the sequence observable step by step**.

Real processors are too fast to observe, static diagrams cannot show state changing over time, and professional simulators are far too complex for a second-year course. As a result, students often memorize the names of the registers without ever *seeing* the MAR being loaded, the instruction travelling into the IR, the ALU computing a result, or the flags being updated.

**The problem addressed by this project:** to design and implement an interactive, browser-based simulator that (a) demonstrates the fetch, decode, and execute stages of the CPU instruction cycle visibly and step by step, (b) keeps every CPU component's state synchronized and inspectable at all times, (c) accepts user-written programs and configurable initial CPU state, and (d) behaves deterministically and validates all input — so that a student can experiment with, and be examined on, the instruction cycle with complete confidence in the correctness of what they observe.

---

## 7. Aim and Objectives

### Aim

To develop an original, interactive, browser-based simulator that demonstrates the CPU instruction cycle — Fetch, Decode, and Execute — with visible register transfers, ALU operations, control signals, and memory access, for use as a learning and demonstration tool in the Computer Organization and Architecture course.

### Objectives

1. To model the CPU components — PC, IR, MAR, MDR, ALU, Control Unit, general-purpose registers R0–R3, status flags (Z, N, C, V), instruction memory, and data memory — and their relationships accurately at an educational level of abstraction.
2. To implement the instruction cycle as three clearly distinguishable stages, with the fetch stage decomposed into explicit micro-steps (PC → MAR → MDR → IR → PC+1).
3. To implement a documented eleven-instruction instruction set with a parser that validates syntax, operands, registers, immediate ranges, memory addresses, and jump targets, and reports errors with line numbers.
4. To provide interactive controls: load example program, edit program, reset, run / pause / resume, step one instruction, step one stage, run until HALT, adjustable speed, and clear log.
5. To allow customization: initial PC, initial register values, initial data-memory contents, the program itself, simulation speed, and the arithmetic width (8-bit, 16-bit, or unbounded) with documented flag behaviour.
6. To present a polished, responsive dashboard with an architecture block diagram whose data paths highlight according to the current stage.
7. To verify correctness with an automated test suite that exercises the real simulator core, and to document all test results honestly.

---

## 8. Scope of the Project

**In scope:**

- A single-page web application (HTML5 + CSS3 + vanilla JavaScript) that runs offline in any modern browser — no server, database, installation, or external library.
- An educational, simplified CPU model: 4 general-purpose registers, 11 instructions, 256-address data memory, separate instruction memory, and 4 status flags.
- Three execution granularities: micro-step, stage, and full instruction; plus continuous run with pause/resume and a run-until-HALT mode.
- Fixed-width 8-bit and 16-bit two's-complement arithmetic modes (with wrap-around, carry, and overflow flags) and an unbounded mode.
- Program and configuration validation with helpful, line-numbered error messages.
- A 32-check automated test suite (`tests.js`) executable with Node.js, plus documented manual browser verification.
- Documentation: README, test cases, this report, and a presentation/viva outline.

**Out of scope (deliberately excluded, see also §21 Limitations):**

- Pipelining, cache, interrupts, I/O devices, DMA, microcode-level control, and multi-core behaviour.
- A real compiler/assembler toolchain — programs are written directly in the simulator's assembly-like syntax.
- Performance fidelity — the goal is pedagogical clarity, not speed.
- Any backend service — the entire project is client-side.

---

## 9. Theoretical Background: The Instruction Cycle

### 9.1 The stored-program concept

A program is a sequence of instructions stored in memory as data (the **von Neumann** / stored-program concept). The CPU cannot execute a program "all at once"; it must bring each instruction from memory into the processor, interpret it, and act on it, one at a time. This is the instruction cycle.

### 9.2 Registers involved in the cycle

| Register | Full name | Role in the cycle |
|---|---|---|
| **PC** | Program Counter | Holds the *index/address of the next instruction* to fetch. Incremented automatically after each fetch; overwritten by jump instructions during execute. |
| **MAR** | Memory Address Register | Holds the *address* being accessed. The CPU's address is placed here before any memory read or write — for both instruction fetch (address from PC) and data access (address from the instruction operand). |
| **MDR** | Memory Data Register | Holds the *data* travelling to or from memory — the fetched instruction during fetch, or the value read/written during STORE/READ. |
| **IR** | Instruction Register | Holds the *currently executing instruction* after it is fetched, so the decode and execute stages can work on a stable copy even if new fetches occur. |
| **R0–R3** | General-purpose registers | Hold operands and results of arithmetic/data operations. |
| **Flags (Z, N, C, V)** | Status flags | Record condition information from the ALU — Zero, Negative, Carry, oVerflow — used by conditional instructions such as JZ. |

### 9.3 The role of the Control Unit

The **Control Unit (CU)** is the conductor of the cycle. It reads the opcode in the IR and generates the correct sequence of **control signals** — Register Write enables, ALU operation select, memory Read/Write strobes, PC source select (increment vs. jump target) — that cause each micro-operation to occur in the right order. In this simulator the Control Unit appears as the Decode stage and the simplified control-signal panel; its decisions drive which registers and memory the Execute stage touches.

### 9.4 Instruction cycle vs. clock cycle

A **clock cycle** is one tick of the processor's clock — the smallest unit of time in a synchronous CPU, typically one register transfer. An **instruction cycle** is the complete fetch–decode–execute of *one instruction*, and therefore spans *multiple* clock cycles (in classic multi-cycle CPUs, roughly 3–5; each of the micro-steps shown by this simulator corresponds to about one clock cycle of a multi-cycle machine). The simulator deliberately separates these: one "Step Stage" press advances the visible machine by one stage (several clock cycles' worth of work), and one "Step Instruction" press completes one full instruction cycle.

---

## 10. Explanation of Fetch, Decode, and Execute

### 10.1 Stage 1 — Fetch

The fetch stage brings the next instruction from instruction memory into the CPU, in five explicit micro-steps (exactly the steps shown by the simulator's log and register panel):

1. The **PC** identifies the index of the next instruction (e.g., PC = 0).
2. The PC value is copied into the **MAR** (MAR ← PC). The MAR now addresses instruction memory.
3. Instruction memory is read at the MAR address; the fetched instruction word enters the **MDR** (MDR ← IMEM[MAR]).
4. The MDR contents are copied into the **IR** (IR ← MDR). The instruction is now "inside" the CPU.
5. The **PC advances** to the next sequential instruction (PC ← PC + 1) — *unless* a later jump overwrites it during execute.

Key modelling point: the simulator keeps **instruction memory separate from data memory** (a Harvard-style organization at the educational level), so an instruction fetch (MAR context = "instruction") is visibly distinct from a data access (MAR context = "data"), even though both go through the same MAR/MDR pair — exactly as in the theoretical model where the same registers serve both paths.

### 10.2 Stage 2 — Decode

The **Control Unit** reads the opcode and operands from the IR and determines:

- the **opcode** (e.g., `ADD`),
- the **destination and source operands** (e.g., R0 and R1),
- the **CPU components required** (e.g., R0, R1, ALU),
- the **intended operation** (add R1 to R0, store result in R0), and
- the **control signals** that will be asserted during execute (e.g., `ALU_op=ADD`, `RegWrite[R0]`).

For example, decoding `ADD R0, R1` identifies operation ADD with destination register R0 and source register R1, requires components R0, R1, and the ALU, and prepares the signals `ALU_op=ADD` and `RegWrite[R0]`. **No state changes** during decode — the stage is pure interpretation.

### 10.3 Stage 3 — Execute

The instruction's operation is performed, driven by the decoded control signals:

- **Arithmetic (ADD, SUB, MUL, CMP):** the ALU receives its two inputs (the register values), performs the operation, produces the result, and updates the flags. The result is written back to the destination register (except CMP, which updates flags only).
- **Data movement (LOAD, MOV, STORE, READ):** LOAD passes the immediate through the ALU bus to the register; MOV copies register to register; STORE places the address in the MAR and the value in the MDR and writes data memory; READ places the address in the MAR, reads data memory into the MDR, and then into the register.
- **Control flow (JMP, JZ):** the condition (none, or the Z flag) is evaluated; if the jump is taken, PC ← target, and the simulator explains *why*; if not taken, the already-incremented PC stands.
- **HALT:** execution stops; the CPU enters the HALTED state and further stepping is safely refused.

An operation is **never displayed as completed until its state update has actually occurred** — the log line and the register/memory panels are rendered from the same state object after the micro-operation runs.

---

## 11. CPU Components and Their Functions (as modelled)

| Component | Function in this simulator |
|---|---|
| **Program Counter (PC)** | Index of the next instruction in instruction memory (0-based). Auto-incremented in fetch; overwritten by taken jumps in execute. |
| **Memory Address Register (MAR)** | Address register for every memory access. Its *context* (instruction / data) is displayed so fetch and data access are distinguishable. |
| **Memory Data Register (MDR)** | Buffer holding the value moving to/from memory. Its *kind* (instruction / data) is displayed. |
| **Instruction Register (IR)** | Holds the current instruction text while it is decoded and executed. |
| **General-purpose registers R0–R3** | Four 8/16-bit (or unbounded) registers holding operands/results, shown in decimal, hexadecimal, and signed decimal. |
| **ALU** | Combinational unit computing ADD, SUB, MUL, CMP (and pass-through for LOAD). Inputs, operation, result, and flag updates are visualized. |
| **Control Unit** | Interprets the IR during Decode; its decisions are shown as a simplified list of control signals per instruction. |
| **Instruction memory** | The validated program itself, indexed by PC (address unit = one instruction). Kept separate from data memory. |
| **Data memory** | 256 addresses (0–255), written by STORE, read by READ; visualized as a grid with read/write highlighting. |
| **Status flags (Z, N, C, V)** | Z: result is zero. N: result is negative (MSB set in fixed-width). C: carry / no-borrow (fixed-width only). V: signed overflow (fixed-width only). |

---

## 12. System Requirements and Tools Used

### Hardware requirements

- Any personal computer capable of running a modern web browser (the simulator itself has negligible resource needs).

### Software requirements

- **To run the simulator:** a modern web browser — Google Chrome, Microsoft Edge, Mozilla Firefox, or Opera (recent versions). No internet connection, server, or installation is required: open `index.html` directly.
- **To run the automated tests (optional but recommended):** [Node.js](https://nodejs.org) (any recent LTS version) and the command `node tests.js`.

### Tools and technologies used

| Tool / Technology | Purpose |
|---|---|
| HTML5 | Structure of the single-page dashboard (15 sections incl. inline SVG block diagram). |
| CSS3 | Responsive grid layout, stage colour coding, accessibility, subtle animations (register/memory flash). |
| JavaScript (ES5-compatible vanilla) | CPU core, parser, micro-step engine, and UI bindings. No frameworks, no external libraries. |
| SVG | CPU architecture block diagram with stage-dependent path highlighting. |
| Node.js | Runs the identical CPU core for the automated test suite (`tests.js`). |
| Any text editor (VS Code / Notepad++) | Editing the program and configuration. |

---

## 13. System Architecture and Block Diagram

### 13.1 Architectural model

- **Organization:** educational Harvard-style separation — instruction memory (the program) and data memory (256 addresses) are distinct, but both are reached through the shared MAR/MDR interface so the classic register model remains visible.
- **Address unit:** one instruction (programs are indexed 0…N−1). Jump targets are instruction indices.
- **Word width:** selectable — 8-bit, 16-bit, or unbounded integers.
- **Execution engine:** a micro-operation queue per stage. Each instruction cycle = Fetch (5 micro-ops) + Decode (1 micro-op) + Execute (1–4 micro-ops depending on the instruction).

### 13.2 Block diagram

The interactive, stage-highlighting version of this diagram is Section 3 of the application itself (an inline SVG). The same structure is:

```
        ┌────────────────────────────────────────────────────────────┐
        │                         CPU                                │
        │                                                            │
        │   ┌──────────────┐        ┌──────────────────────┐         │
        │   │ Control Unit │◄───────│  IR (Instruction      │         │
        │   │  (Decode)    │        │     Register)         │         │
        │   └──┬───┬───┬───┘        └──────────▲───────────┘         │
        │      │   │   │                       │                     │
        │      │   │   ▼                       │ MDR                 │
        │      │   │  ┌────────────┐   ┌───────┴───────┐             │
        │  CU  │   │  │    ALU     │   │ MDR (Memory    │             │
        │ sig- │   │  │ ADD/SUB/   │   │  Data Register)│             │
        │ nals │   │  │ MUL/CMP    │   └───────▲───────┘             │
        │      │   │  └──┬───▲─────┘           │                     │
        │      ▼   │     │   │            ┌────┴────┐                │
        │  ┌────┐ │   result  operands    │  MAR    │◄── PC (fetch)  │
        │  │ PC │ │     │   │            │(address) │    or operand │
        │  └────│─┘     │   │            └──┬───┬──┘   (data access)│
        │      │        │   │               │   │                    │
        │      ▼        ▼   │               │   │                    │
        │  ┌──────────────┐ │               │   │                    │
        │  │ Registers    │◄┘  (write-back) │   │                    │
        │  │ R0 R1 R2 R3  │                │   │                    │
        │  └──────────────┘                │   │                    │
        └──────────────────────────────────┼───┼────────────────────┘
                                           │   │
                     ┌─────────────────────▼─┐ ┌▼───────────────────┐
                     │  INSTRUCTION MEMORY   │ │   DATA MEMORY      │
                     │  (the program,        │ │   256 addresses    │
                     │   indexed by PC)      │ │   (0–255)          │
                     └───────────────────────┘ └────────────────────┘
```

**Data paths shown and highlighted at runtime:**

- Fetch: PC → MAR → instruction memory → MDR → IR, plus PC increment.
- Decode: IR → Control Unit.
- Execute (register ops): registers → ALU → registers.
- Execute (data ops): MAR/MDR ↔ data memory.
- Control: CU → PC (jump), CU → registers (write enable), CU → ALU (operation select).

**Role of the Control Unit in the diagram:** the CU is fed by the IR and drives everything else — it selects the ALU operation, enables register writes, triggers memory read/write, and chooses the next PC value (increment or jump target). In the interactive diagram these control paths light up together with the data path they enable.

---

## 14. Algorithm and Flowchart

### 14.1 Main algorithm

```
ALGORITHM: RunInstructionCycle
INPUT : validated program P, initial CPU state S (PC, registers, memory, width)
OUTPUT: final CPU state + execution log

1.  Parse and validate P → if any error: report with line numbers and STOP.
2.  Validate initial configuration (PC range, register/memory values, width) → report and STOP on error.
3.  Initialise: PC ← initialPC; IR, MAR, MDR ← empty; registers ← initial values;
    data memory ← initial values; flags ← 0; counters ← 0; status ← idle.
4.  Repeat until HALT or error:
    a. FETCH:
       MAR ← PC (context: instruction)
       MDR ← InstructionMemory[MAR]   (kind: instruction)
       IR  ← MDR
       PC  ← PC + 1                   (sequential; jumps overwrite later)
    b. DECODE:
       (opcode, operands) ← parse(IR)
       components, control signals ← DECODE_TABLE[opcode]
    c. EXECUTE (case on opcode):
       LOAD  Rd,imm : Rd ← imm                                  (ALU pass-through)
       MOV   Rd,Rs  : Rd ← Rs
       ADD   Rd,Rs  : (result, flags) ← ALU(ADD, Rd, Rs); Rd ← result
       SUB   Rd,Rs  : (result, flags) ← ALU(SUB, Rd, Rs); Rd ← result
       MUL   Rd,Rs  : (result, flags) ← ALU(MUL, Rd, Rs); Rd ← result
       CMP   Ra,Rb  : (_, flags)     ← ALU(SUB, Ra, Rb)          (no write-back)
       STORE Rs,addr: MAR ← addr (context: data); MDR ← Rs; DataMem[MAR] ← MDR
       READ  Rd,addr: MAR ← addr (context: data); MDR ← DataMem[MAR]; Rd ← MDR
       JMP   t      : PC ← t                                     (unconditional)
       JZ    t      : if flags.Z = 1 then PC ← t else no change
       HALT         : status ← HALTED; STOP
       (safety: if instruction count exceeds 10 000 → error "instruction limit exceeded")
5.  On program end without HALT → error "fetch failed: PC outside program".
```

### 14.2 Flowchart

```
                    ┌─────────────────┐
                    │      START      │
                    └────────┬────────┘
                             ▼
              ┌──────────────────────────────┐
              │ Parse program & validate     │
              │ configuration                │
              └───────┬──────────────┬───────┘
                 valid│              │invalid
                      ▼              ▼
        ┌───────────────────┐   ┌─────────────────────┐
        │ Initialise CPU    │   │ Report error with   │
        │ state (PC, regs,  │   │ line number; STOP   │
        │ memory, flags)    │   └─────────────────────┘
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐
   ┌───►│  FETCH:           │
   │    │  MAR←PC, MDR←IMEM │
   │    │  IR←MDR, PC←PC+1  │
   │    └─────────┬─────────┘
   │              ▼
   │    ┌───────────────────┐
   │    │  DECODE (CU):     │
   │    │  opcode, operands,│
   │    │  control signals  │
   │    └─────────┬─────────┘
   │              ▼
   │    ┌───────────────────────────────┐
   │    │  EXECUTE                      │
   │    │  ┌─────────┬─────────┬──────┐ │
   │    │  │ ALU op? │ memory? │ jump?│ │
   │    │  └────┬────┴────┬────┴──┬───┘ │
   │    └───────┼─────────┼───────┼─────┘
   │            ▼         ▼       ▼
   │      compute &     MAR/MDR  PC ← target
   │      write back    ↔ data   (if taken)
   │      + flags       memory
   │            │         │       │
   │            └─────────┴───┬───┘
   │                          ▼
   │                 ┌────────────────┐      yes   ┌──────────────┐
   │                 │ opcode = HALT? ├────────────►│ status=HALTED│
   │                 └───────┬────────┘             │ STOP         │
   │                     no  │                      └──────────────┘
   │                         ▼
   │                 ┌────────────────┐      yes   ┌──────────────┐
   │                 │ >10 000 instr.?├────────────►│ error; STOP  │
   │                 └───────┬────────┘             └──────────────┘
   │                     no  │
   └─────────────────────────┘
```

### 14.3 Micro-step engine algorithm

Each stage is decomposed into a queue of micro-operations. `Step Stage` drains the current stage's queue; `Step Instruction` drains queues until the next fetch boundary; `Run` repeats instruction cycles on a timer. Every micro-operation is a function that (1) mutates exactly the state it represents, (2) appends one log line *after* the mutation, and (3) records highlight information for the diagram/register panels.

---

## 15. Instruction Set and Syntax

One instruction per line. `;` starts a comment. Opcodes are case-insensitive; registers must be written `R0`–`R3`. Operands are separated by a comma. Jump targets are **0-based instruction indices**. Data addresses are **0–255**.

| # | Instruction | Format | Semantics | Flags updated |
|---|---|---|---|---|
| 1 | LOAD | `LOAD Rd, imm` | Load immediate value `imm` into `Rd` | — |
| 2 | MOV | `MOV Rd, Rs` | Copy `Rs` into `Rd` | — |
| 3 | ADD | `ADD Rd, Rs` | `Rd ← Rd + Rs` | Z, N, C, V |
| 4 | SUB | `SUB Rd, Rs` | `Rd ← Rd − Rs` | Z, N, C, V |
| 5 | MUL | `MUL Rd, Rs` | `Rd ← Rd × Rs` | Z, N, C, V |
| 6 | STORE | `STORE Rs, addr` | `DataMem[addr] ← Rs` | — |
| 7 | READ | `READ Rd, addr` | `Rd ← DataMem[addr]` | — |
| 8 | JMP | `JMP t` | Unconditional jump: `PC ← t` | — |
| 9 | JZ | `JZ t` | Jump if Z = 1: `PC ← t` | — |
| 10 | CMP | `CMP Ra, Rb` | Compare: flags ← result of `Ra − Rb` (registers unchanged) | Z, N, C, V |
| 11 | HALT | `HALT` | Stop execution | — |

### Operand ranges

| Operand | 8-bit mode | 16-bit mode | Unbounded |
|---|---|---|---|
| Immediate `imm` | −128 … 255 | −32 768 … 65 535 | any integer |
| Register initial value | −128 … 255 | −32 768 … 65 535 | any integer |
| Data address `addr` | 0 … 255 | 0 … 255 | 0 … 255 |
| Jump target `t` | 0 … N−1 (N = program length) | 0 … N−1 | 0 … N−1 |

### Flag rules (documented and consistently implemented)

- **Z** — set when the ALU result is 0.
- **N** — set when the result is negative (in fixed-width mode: sign bit / MSB set).
- **C** — carry, fixed-width modes only. ADD: C = 1 when the unsigned sum exceeds the maximum value. SUB/CMP: C = 1 when there is **no borrow** (i.e., `Ra ≥ Rb`, the ARM convention). MUL: C = 1 on unsigned overflow.
- **V** — signed overflow, fixed-width modes only. Set when the signed interpretation of the inputs and result is inconsistent (e.g., positive + positive = negative). In unbounded mode C and V are always 0.
- Negative immediates are stored in **two's complement** in fixed-width mode (e.g., −5 is stored as 251 in 8-bit mode and displayed as −5 in the signed column).

Examples (8-bit): `100 + 100 → 200 (signed −56), V=1, N=1, C=0` (overflow); `200 + 100 → 44, C=1` (carry/wrap); `5 − 10 → 251 (signed −5), N=1, C=0` (borrow).

### Validation performed before execution

- Unknown opcode → error with line number.
- Wrong operand count/type, invalid register name (e.g., `R4`), non-integer immediate → error with line number.
- Immediate / initial value out of range for the selected width → error.
- Data address outside 0–255 → error.
- Jump target outside the program → error with the valid range.
- Initial PC outside the program → configuration error.
- Empty program / missing HALT at the end → detected at runtime with a clear error ("Fetch failed: PC outside the program").

The simulator **never silently executes an invalid instruction** — execution is blocked until all errors are fixed.

---

## 16. Implementation Methodology

The project was built in the order recommended for explainable academic software:

1. **Architecture and design assumptions first** — decided the memory model (separate instruction/data memories), address unit (instruction index), register set (R0–R3), widths (8/16/unbounded), flag rules, and the safety limit, *before* writing code (documented in §9, §13, §15).
2. **CPU core as a pure-logic module** — the entire processor (parser, ALU, micro-step engine, state) was implemented in `script.js` **Part 1** with no DOM access, wrapped in a pattern that exports it both to the browser (`window.CpuSim`) and to Node.js (`module.exports`). This is what allows the automated tests to exercise *exactly* the code the browser runs.
3. **Fetch, Decode, Execute engine** — each stage builds a queue of micro-operations; stepping drains queues one micro-op at a time; state mutations and log lines are produced by the same function so the UI can never show a completed operation whose state update did not occur.
4. **Interactive controls and editable inputs** — run/pause/resume (single toggle button that stays enabled while running so Pause can be clicked), step-instruction, step-stage, reset, program editor with live validation, configuration panel (PC, registers, memory, width), speed control.
5. **Visual interface and architecture diagram** — 15-section responsive dashboard; an SVG block diagram whose data paths highlight according to the active stage; register/memory flash animations on change.
6. **Automated tests** — 32 checks in `tests.js` against the real core; run with `node tests.js`; all pass.
7. **Verification of all sample programs** — each of the five built-in samples was run to completion in the browser and its final state verified.
8. **Documentation** — README, test-cases, this report, presentation outline.

### Code organization

```
2927041a/
├── index.html              ← 15-section dashboard (structure + inline SVG diagram)
├── style.css               ← layout, stage colours, animations, responsiveness
├── script.js               ← Part 1: CPU core (pure logic)  |  Part 2: browser UI
├── tests.js                ← 32-check automated test suite (Node.js)
├── test-output.md          ← saved output of a passing test run
├── test-cases.md           ← test plan, results, coverage mapping
├── README.md               ← how to run, quick start, reference
├── project-report.md       ← this document
└── presentation-outline.md ← demo script, slides, viva Q&A
```

---

## 17. Explanation of Important Source-Code Modules

All paths refer to `script.js` unless noted. Line numbers may shift slightly with edits; the section banners are stable.

### 17.1 CPU core — `PART 1 — CPU CORE` (script.js:21)

- **Constants and widths** (≈ lines 25–37): `REG_NAMES` (R0–R3), `OPCODES` (the 11 instructions), `DATA_MEM_SIZE = 256`, `MAX_INSTRUCTIONS = 10000` (infinite-loop guard), and `WIDTHS` describing 8- and 16-bit mode (`mask`, `maxU`, `minS`, `maxS`). Unbounded mode is represented by the absence of a width entry.
- **Two's-complement helpers** (`toUnsigned`, `toSigned`, ≈ lines 41–51): convert between the stored unsigned representation and the signed interpretation, implementing wrap-around correctly for both widths.
- **ALU** (`aluCompute`, ≈ lines 58–95): a pure function taking `(op, a, b, width)` and returning `{ raw, z, n, c, v }`. Fixed-width mode computes on unsigned representations, wraps the result, and derives flags; the SUB/CMP carry uses the "C = 1 when no borrow" convention; ADD overflow is detected by signed sign inconsistency. Unbounded mode computes in plain integers and reports only Z and N. Because it is pure, it is directly unit-testable.
- **Instruction parser** (`parseProgram`, ≈ lines 97–213): tokenizes each line (comments, commas, whitespace), validates opcode, operand count, register names, integer immediates, immediate range (per width), and — after the whole program is known — jump targets against the program length. Errors carry **line numbers**. Each parsed instruction records its operand *roles* (reg/imm/addr/target) so Decode and Execute share one source of truth.
- **Decode table** (`DECODE_TABLE` + `decodeInstruction`, ≈ lines 214–242): for each opcode, the expected format, a human description, the components involved, and the simplified control signals — exactly what the Decode panel renders.
- **Simulator factory** (`createSimulator`, ≈ lines 243–765): the heart of the project. `createSimulator(config)` validates configuration, parses the program, and returns an object with:
  - `state` — the complete, inspectable CPU state (status, stage, pc, ir, mar, mdr (+ their contexts/kinds), regs, flags, dataMemory, decode info, alu info, log, counters);
  - `stepMicro()` — advance **one micro-operation** (the finest granularity);
  - `stepStage()` — advance to the end of the current stage (Fetch/Decode/Execute);
  - `stepInstruction()` — advance one full instruction cycle;
  - `runToCompletion()` — run until HALT/error (used by tests);
  - `reset()` — restore the initial state (registers, memory, flags, counters, log kept as a reset entry);
  - Fetch builds the five canonical micro-ops (PC→MAR→MDR→IR→PC+1); Execute builds instruction-specific micro-ops with **function-valued log labels** evaluated after the mutation, so log text always shows post-update values; ALU results are carried to the write-back micro-op via a captured `pendingResult` closure so the displayed intermediate cannot diverge from what is stored.
- **Sample programs** (`SAMPLE_PROGRAMS`, ≈ lines 767–800): five programs — the required basic sample, arithmetic (SUB/MUL), comparison (JZ not taken), a countdown loop (JZ taken), and an 8-bit overflow demo.
- **Exports** (≈ lines 802–823): the dual-environment module wrapper (`module.exports` for Node, `global.CpuSim` for the browser).

### 17.2 Browser UI — `PART 2 — BROWSER UI` (script.js:826)

- **Element helpers / configuration panel** (≈ lines 831–922): read and validate the customization inputs (initial PC, R0–R3, memory list `addr:value`, width), with errors shown inline — never silently corrected.
- **Program view / editor** (≈ lines 923–951): renders the program with the current instruction highlighted; the editor validates on Apply and refuses to load a program with errors.
- **Registers, flags, IR/MAR/MDR** (≈ lines 952–1012): render values in decimal/hex/signed, flash changed registers, show MAR context (instruction/data) and MDR kind.
- **Stage indicator / decode / ALU / control signals** (≈ lines 1013–1095): the Fetch→Decode→Execute highlight bar and the panels fed by `state.decode`, `state.alu`, and `DECODE_TABLE`.
- **Memory grid** (≈ lines 1096–1159): 256 cells with hover inspection and read/write flash animations.
- **Execution log** (≈ lines 1160–1178): timestamped, stage-badged list of every micro-operation, newest first, with a Clear button.
- **Architecture diagram highlighting** (≈ lines 1205–1254): toggles CSS classes on the SVG boxes/paths from `state.lastHighlight`, so the diagram shows the *actual* path used by the current micro-operation.
- **Status pill + control buttons** (≈ lines 1255–1287): button enable/disable rules. The Run button is a Run/Pause/Resume toggle that stays **enabled** while running (a disabled button could never receive the Pause click); Step buttons are disabled while running or in a terminal state.
- **Run loop** (≈ lines 1288–1322): a `setTimeout` chain (never `setInterval`) whose tick handler checks that the run is still active before stepping — this prevents race conditions from multiple Run clicks. Speed levels range from Slow to Turbo (Turbo batches instructions per tick); "Run" continues until HALT, Pause, or error.

### 17.3 `index.html`

The 15 required sections in order: header (title/subject/topic with student placeholders), overview + learning objectives, SVG architecture diagram, program editor + sample selector, controls, register panel (special registers + R0–R3), data-memory panel, current instruction & pointer, stage indicator, ALU panel, control-unit/signal panel, execution log, status flags, execution summary, and help (instruction reference, flag rules, model assumptions, quick start, limitations). Tooltips explain every component.

### 17.4 `style.css`

CSS variables for the three stage colours (blue Fetch / amber Decode / green Execute), the responsive three-column grid that collapses to two and one column, accessible colour contrast, the status-pill states (IDLE / RUNNING / PAUSED / HALTED / ERROR), flash animations for changed registers and memory cells, and print-friendly dark log panel.

### 17.5 `tests.js`

A dependency-free Node test runner that loads the **real** core (`require('./script.js')`), builds simulators for each scenario, drives them with `stepStage`/`stepMicro`/`runToCompletion`, and compares actual against expected state. It prints a markdown results table and exits non-zero on any failure — it can never "display predetermined PASS messages".

---

## 18. Sample Program and Step-by-Step Execution

### 18.1 The required sample program

```asm
LOAD R0, 10      ; R0 ← 10
LOAD R1, 5       ; R1 ← 5
ADD  R0, R1      ; R0 ← R0 + R1
STORE R0, 100    ; M[100] ← R0
READ  R2, 100    ; R2 ← M[100]
HALT             ; stop
```

**Expected final state:** R0 = 15, R1 = 5, R2 = 15, M[100] = 15, status = HALTED.

### 18.2 Instruction-by-instruction trace (verified by running the simulator)

**Instruction 0 — `LOAD R0, 10`** (detailed micro-step view)

| Step | Stage | Micro-operation | State after |
|---|---|---|---|
| 1 | Fetch | PC identifies next instruction | PC = 0 |
| 2 | Fetch | MAR ← PC | MAR = 0 (context: instruction) |
| 3 | Fetch | MDR ← InstructionMemory[MAR] | MDR = `LOAD R0, 10` (kind: instruction) |
| 4 | Fetch | IR ← MDR | IR = `LOAD R0, 10` |
| 5 | Fetch | PC ← PC + 1 | PC = 1 |
| 6 | Decode | CU reads IR → opcode LOAD, dest R0, imm 10; signals `ALU_op=PASS(imm)`, `RegWrite[R0]` | decode panel filled; no state change |
| 7 | Execute | Immediate 10 passes through the ALU bus; R0 ← 10 | R0 = 10 |

**Instruction 1 — `LOAD R1, 5`**: same pattern; after the cycle PC = 2, R1 = 5.

**Instruction 2 — `ADD R0, R1`**

| Step | Stage | Micro-operation | State after |
|---|---|---|---|
| 1–5 | Fetch | MAR ← 2; MDR ← `ADD R0, R1`; IR ← MDR; PC ← 3 | IR = `ADD R0, R1`, PC = 3 |
| 6 | Decode | opcode ADD, dest R0, source R1; components R0, R1, ALU; signals `ALU_op=ADD`, `RegWrite[R0]` | — |
| 7 | Execute | ALU: A = 10 (R0), B = 5 (R1), op = ADD → result 15; flags Z=0, N=0, C=0, V=0 | ALU panel shows inputs/result |
| 8 | Execute | R0 ← 15 (write-back) | R0 = 15 |

**Instruction 3 — `STORE R0, 100`**: fetch (PC 3→4); decode (components MDR, MAR, data memory; signals `MemWrite`, `MAR←addr`); execute — MAR ← 100 (context: **data**), MDR ← 15 (kind: **data**), M[100] ← 15. One memory **write** counted.

**Instruction 4 — `READ R2, 100`**: fetch (PC 4→5); decode; execute — MAR ← 100, MDR ← M[100] = 15, R2 ← 15. One memory **read** counted.

**Instruction 5 — `HALT`**: fetch (PC 5→6); decode; execute — status ← HALTED. Further stepping is refused; running again is a safe no-op.

### 18.3 Final state (automated test T08, actual result)

| Item | Value |
|---|---|
| R0 | **15** |
| R1 | **5** |
| R2 | **15** |
| Data memory [100] | **15** |
| Status | **HALTED** |
| Instructions executed | 6 |
| Memory writes / reads | 1 / 1 |

*(This table is reproduced from the automated test run — see §19; it is a real executed result, not a designed expectation.)*

### 18.4 Additional sample programs (all built into the UI's sample selector)

1. **Arithmetic (SUB / MUL):** loads 40 and 25, subtracts (R0 = 15), then multiplies registers to demonstrate MUL and flag behaviour.
2. **Compare & conditional jump (not taken):** compares 10 with 20 (N=1), `JZ` not taken because Z=0 — the following instruction executes.
3. **Countdown loop (JZ taken):** subtracts 1 from R0 in a loop, stores each value at address 110, compares with 0, and jumps back until zero — demonstrates a real loop with a taken conditional jump.
4. **8-bit overflow demo:** 100 + 100 in 8-bit mode → result 200 (signed −56) with V=1, N=1 — demonstrates documented overflow behaviour.

Each sample is loaded with one click from the **Sample program** selector and can be edited freely.

---

## 19. Test Cases and Results

### 19.1 Approach

Correctness was verified on two levels:

1. **Automated tests** (`tests.js`, run with `node tests.js`): 32 checks that execute the **real simulator core** — the same code the browser runs — covering the fetch micro-step sequence, every instruction, flags in all three arithmetic modes, jumps taken and not taken, all validation errors, reset behaviour, single-step behaviour, PC sequencing, HALT behaviour, and the infinite-loop guard.
2. **Manual browser verification:** 10 end-to-end checks of the running UI (controls, panels, editor, configuration, error display).

Full details are in **`test-cases.md`**; the raw passing output is saved in **`test-output.md`**.

### 19.2 Automated test summary (run date: 2026-10-19)

| Area | Checks | Result |
|---|---|---|
| Fetch micro-steps of LOAD (MAR, MDR, IR, PC) | 2 | PASS |
| MOV / ADD / SUB / MUL | 4 | PASS |
| STORE–READ round trip | 1 | PASS |
| Required sample program final state | 1 | PASS |
| JMP / JZ taken / JZ not taken | 3 | PASS |
| CMP flags | 1 | PASS |
| HALT + stepping after HALT + double-run safety | 2 | PASS |
| Validation errors (opcode, register, jump target, address, immediate, missing HALT) | 6 | PASS |
| Reset (+ re-run after reset) | 2 | PASS |
| Stage stepping sequence / sequential PC | 2 | PASS |
| 8-bit overflow / carry / 16-bit / unbounded | 4 | PASS |
| Infinite-loop guard | 1 | PASS |
| Initial PC / register / memory configuration | 1 | PASS |
| JZ uses real flag state (LOAD does not set Z) | 1 | PASS |
| **Total** | **32** | **32 passed, 0 failed** |

Representative checks (expected vs. actual — full table in `test-cases.md`):

| Test | Input | Expected | Actual | Result |
|---|---|---|---|---|
| Required sample final state | the §18.1 program | R0=15, R1=5, R2=15, M[100]=15, HALTED | identical | PASS |
| 8-bit overflow | 100 + 100 (8-bit) | stored 200, signed −56, V=1, N=1, C=0 | identical | PASS |
| 8-bit carry | 200 + 100 (8-bit) | stored 44, C=1, V=0 | identical | PASS |
| Negative subtraction | 5 − 10 (8-bit) | stored 251, signed −5, N=1 | identical | PASS |
| Infinite loop guard | `JMP 0` | error "Instruction limit exceeded (10000)" | identical | PASS |
| Invalid register | `ADD R0, R4` | rejected, error mentions R4, line number present | identical | PASS |

### 19.3 Manual browser verification (2026-10-19)

| # | Check | Result |
|---|---|---|
| 1 | Page loads with all 15 sections, no console errors | PASS |
| 2 | Step Stage walks Fetch → Decode → Execute with highlighting | PASS |
| 3 | Step Instruction completes full cycles; PC advances 0→1→2… | PASS |
| 4 | Run runs to HALT; final state matches §18.3 | PASS |
| 5 | Run → Pause (mid-cycle) → Resume works; no double-run race | PASS |
| 6 | Reset restores initial registers, memory, flags, counters | PASS |
| 7 | Sample selector loads all 5 programs; loop sample terminates via JZ | PASS |
| 8 | Invalid program (`FOO R0`) shows line-numbered error; Apply blocked | PASS |
| 9 | Configuration (initial PC / registers / memory) applied and respected | PASS |
| 10 | 8-bit overflow and unbounded modes produce documented flag results | PASS |

---

## 20. Screenshots Checklist

> **Note to student:** take these screenshots yourself while demonstrating the simulator (press `PrtSc` / `Win+Shift+S`, paste into your report document). The checklist below tells you exactly which moments capture the required evidence. Insert each screenshot in the marked place, with a caption, in your final printed/PDF report.

| # | Screenshot to capture | Where in the UI | Shows |
|---|---|---|---|
| S1 | Full dashboard on load | whole page | complete 15-section layout |
| S2 | Fetch stage active, first instruction | Register panel + stage indicator + diagram | MAR/MDR/IR filling during fetch, Fetch highlighting |
| S3 | Decode stage of `ADD R0, R1` | Decode + control-signal panels | opcode, operands, components, signals |
| S4 | Execute stage of `ADD R0, R1` | ALU panel | ALU inputs 10 and 5, op ADD, result 15, flags |
| S5 | STORE executing | Memory panel | M[100] turning 15 with write flash |
| S6 | READ executing | Memory + register panel | read flash and R2 ← 15 |
| S7 | Final state after HALT | Summary + status pill | R0=15, R1=5, R2=15, M[100]=15, HALTED |
| S8 | Step-by-step execution log | Log panel | micro-operations of one full cycle |
| S9 | Program editor with an error | Editor + error box | line-numbered validation error |
| S10 | Configuration panel in use | CPU configuration | initial PC / registers / memory / width |
| S11 | Overflow demo (8-bit) | Flags + ALU | 100+100 → V=1 result |
| S12 | Countdown loop sample mid-run | Program list + log | loop with JZ taken |
| S13 | `node tests.js` output in terminal | terminal | 32/32 passing |
| S14 | Responsive layout (narrow window) | whole page | one-column mobile layout |

---

## 21. Advantages and Limitations

### Advantages

1. **True step-level visibility** — micro-step, stage, and instruction granularity show exactly *when* each register changes, going beyond stage-only simulators.
2. **One code base, two consumers** — the same DOM-free core runs in the browser and in the Node test suite, so the tested logic is provably the demonstrated logic.
3. **Strict validation** — no invalid instruction is ever executed; all errors are line-numbered and explained.
4. **Faithful educational model** — fetch vs. data memory access is distinguished through MAR context/MDR kind; PC, jump, and flag semantics follow documented, textbook-consistent rules.
5. **Customizable** — program, initial PC, registers, data memory, speed, and arithmetic width (8/16/unbounded) are all editable.
6. **Zero dependencies** — runs offline by opening one file; nothing to install for the demonstration.
7. **Presentation-ready UI** — architecture diagram highlights the live data path; log provides a replayable record of the demonstration.

### Limitations (stated honestly)

1. **Simplified architecture** — no pipelining, cache, interrupts, I/O, DMA, or microcode; a real processor overlaps and accelerates these stages.
2. **Small instruction set** — 11 instructions, 4 registers, 256 data addresses; no indexed/indirect addressing, shifts, logic ops, or subroutine support.
3. **Instruction-granular memory** — instruction memory addresses are instruction indices, not byte addresses; there is no variable-length encoding.
4. **Educational timing** — stages are animated sequentially (like a classic multi-cycle CPU); a modern CPU completes several instructions per clock via pipelining.
5. **No persistence** — programs are not saved between page reloads (copy-paste from the editor is the intended workflow).
6. **Two's-complement display only in fixed modes** — unbounded mode uses plain JavaScript integers.

---

## 22. Possible Future Enhancements

1. **Pipelined mode** — show I–D–E stages of consecutive instructions overlapping.
2. **More instructions** — shifts, bitwise AND/OR/XOR, `INC`/`DEC`, `CALL`/`RET` with a stack pointer and stack memory.
3. **Addressing modes** — immediate, direct, indirect, and indexed addressing with visible effective-address computation.
4. **Assembly→binary view** — display each instruction's machine-code encoding to connect assembly with binary.
5. **Microcode view** — a lower level beneath control signals showing the microprogram.
6. **Program persistence** — save/load programs in browser local storage, or import/export as `.txt`.
7. **Cache simulation** — add a small cache between CPU and data memory with hit/miss statistics.
8. **I/O devices** — simple input/output ports (OUT to a console, IN from a text field).
9. **Step-back / undo** — state snapshots allowing reverse debugging of a program.
10. **Comparative widths experiment** — side-by-side 8-bit vs. 16-bit runs of the same program.

---

## 23. Conclusion

This micro project set out to make the CPU instruction cycle — fetch, decode, execute — *visible*, and to do so with provable correctness. The delivered simulator models the PC, IR, MAR, MDR, ALU, Control Unit, general-purpose registers, status flags, and separate instruction and data memories; decomposes every instruction into explicit micro-operations; validates all user input before execution; and presents all of it in a presentation-ready dashboard with a live architecture diagram.

Correctness was not assumed but tested: a 32-check automated suite runs the real simulator core and passes in full, the required sample program reproduces its expected final state exactly (R0 = 15, R1 = 5, R2 = 15, M[100] = 15, HALTED), and ten end-to-end checks in the browser confirm the interactive behaviour of every control.

Beyond the marks of the COA–CO5 assessment, the project's real value is pedagogical: any instruction of the eleven-instruction set can be watched register-transfer by register-transfer, which converts the instruction cycle from memorized theory into directly observable behaviour. The documented assumptions and limitations (§15, §21) make clear exactly where the educational model ends and real processor complexity begins.

---

## 24. References

*(Standard, widely available COA textbooks and official technical documentation. Verify the edition available in your library before citing and fill in the year/edition you actually consult.)*

1. William Stallings, *Computer Organization and Architecture: Designing for Performance*, Pearson Education.
2. David A. Patterson and John L. Hennessy, *Computer Organization and Design: The Hardware/Software Interface*, Morgan Kaufmann / Elsevier.
3. Carl Hamacher, Zvonko Vranesic, Safwat Zaky, *Computer Organization*, McGraw-Hill.
4. M. Morris Mano, *Computer System Architecture*, Pearson Education.
5. Andrew S. Tanenbaum and Todd Austin, *Structured Computer Organization*, Pearson.
6. MDN Web Docs — HTML, CSS, and JavaScript reference, Mozilla — https://developer.mozilla.org
7. ECMAScript Language Specification, ECMA International — https://ecma-international.org
8. Sanjivani University COA–CO5 Micro Project notice (assessment criteria and submission requirements), [Year].

> **Note to student:** reference [8] is the notice you received; cite its exact title/year as issued by the department.

---

*End of report. Prepared as part of the COA–CO5 micro project. All simulator results quoted in this report (§18.3, §19) are reproduced from actual executed runs on 2026-10-19; screenshots (§20) are a checklist and must be captured by the student.*
