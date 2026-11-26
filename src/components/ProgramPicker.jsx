import Sheet from "./Sheet";
import { IconCheck } from "./icons";
import { PROGRAM_LIST, PROGRAMS, REST, VOLUME_LABEL } from "../data/exercises";

// Bottom sheet to choose what to train today: any program from the library,
// or a rest day. The weekday's scheduled default is marked "Scheduled";
// picking it clears a swap.
export default function ProgramPicker({ dayInfo, onPick, onClose }) {
  const current = dayInfo.programId ?? REST;
  const defaultId = dayInfo.defaultProgramId ?? REST;

  function choose(id) {
    // Picking the weekday's own default is the same as clearing the swap.
    onPick(id === defaultId ? undefined : id);
    onClose();
  }

  const options = [
    ...PROGRAM_LIST.map((p) => ({
      id: p.id,
      title: p.focus,
      meta: `${p.exercises.length} exercises · ${VOLUME_LABEL} · Rest ${p.rest}`,
    })),
    { id: REST, title: "Rest day", meta: "No workout today" },
  ];

  return (
    <Sheet title="Choose today's workout" onClose={onClose}>
      <p className="picker-hint">
        {dayInfo.label}'s schedule: <strong>{defaultId === REST ? "Rest" : PROGRAMS[defaultId].focus}</strong>.
        Pick another program to swap it for today only.
      </p>
      <div className="picker-list">
        {options.map((o) => {
          const selected = o.id === current;
          return (
            <button
              key={o.id}
              className={`picker-option${selected ? " selected" : ""}`}
              onClick={() => choose(o.id)}
            >
              <span className="picker-option-text">
                <span className="picker-option-title">
                  {o.title}
                  {o.id === defaultId && <span className="picker-badge">Scheduled</span>}
                </span>
                <span className="picker-option-meta">{o.meta}</span>
              </span>
              <span className={`checkbox${selected ? " checked" : ""}`}>{selected && <IconCheck />}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
