export interface DetailRow {
  label: string
  value: string
  highlight?: boolean
}

export interface NotifItem {
  id: string
  type: "revision" | "missed_task" | "pending_task"
  title: string
  description: string
  details: DetailRow[]
  route: string
  color: string
  bg: string
  border: string
}
