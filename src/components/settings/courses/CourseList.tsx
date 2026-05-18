import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CourseCard } from "./CourseCard";
import type { CourseRow } from "./tokens";

interface Props {
  courses: CourseRow[];
  onToggle: (id: string) => void;
  onReorder: (next: CourseRow[]) => void;
  onEdit: (id: string) => void;
  onOffer: (id: string) => void;
}

export function CourseList({ courses, onToggle, onReorder, onEdit, onOffer }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = courses.findIndex((c) => c.id === active.id);
    const newIndex = courses.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...courses];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onReorder(next.map((c, i) => ({ ...c, order: i })));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={courses.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onToggle={() => onToggle(course.id)}
              onEdit={() => onEdit(course.id)}
              onOffer={() => onOffer(course.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
