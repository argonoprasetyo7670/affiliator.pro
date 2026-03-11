"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FolderOpen, Plus, MoreVertical, Trash2, Pencil, Loader2, X } from "lucide-react"
import { createProject, getProjects, deleteProject, updateProject } from "@/app/actions/project"
import { toast } from "sonner"
import Link from "next/link"
import { format } from "date-fns"

type Asset = {
  id: string
  type: string
  url: string
  createdAt: string
}

type Project = {
  id: string
  name: string
  description: string | null
  updatedAt: string
  assets: Asset[]
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [heroVisible, setHeroVisible] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createDesc, setCreateDesc] = useState("")
  const [creating, setCreating] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editing, setEditing] = useState(false)

  const fetchProjects = async () => {
    setLoading(true)
    const res = await getProjects()
    if (res.success) setProjects(res.projects as unknown as Project[])
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async () => {
    if (!createName.trim()) return
    setCreating(true)
    const res = await createProject(createName.trim(), createDesc.trim() || undefined)
    if (res.success) {
      toast.success("Project berhasil dibuat!")
      setCreateOpen(false)
      setCreateName("")
      setCreateDesc("")
      fetchProjects()
    } else {
      toast.error(res.error || "Gagal membuat project")
    }
    setCreating(false)
  }

  const handleEdit = async () => {
    if (!editProject || !editName.trim()) return
    setEditing(true)
    const res = await updateProject(editProject.id, editName.trim(), editDesc.trim() || undefined)
    if (res.success) {
      toast.success("Project diperbarui!")
      setEditOpen(false)
      fetchProjects()
    } else {
      toast.error(res.error || "Gagal memperbarui project")
    }
    setEditing(false)
  }

  const handleDelete = async (project: Project) => {
    if (!confirm(`Hapus project "${project.name}"?`)) return
    const res = await deleteProject(project.id)
    if (res.success) {
      toast.success("Project dihapus")
      fetchProjects()
    } else {
      toast.error("Gagal menghapus project")
    }
  }

  const openEdit = (project: Project) => {
    setEditProject(project)
    setEditName(project.name)
    setEditDesc(project.description || "")
    setEditOpen(true)
  }

  const featuredProject = projects.find(p => p.assets.length > 0)
  const featuredAsset = featuredProject?.assets[0]

  return (
    <div className="-mx-4 -mb-4 min-h-full bg-white text-black px-5 pb-8 pt-1">
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-5 animate-spin text-black/30" />
        </div>
      ) : (
        <>
          {/* Hero */}
          {featuredProject && featuredAsset && heroVisible && (
            <div className="relative w-full rounded-2xl overflow-hidden mb-5" style={{ height: 300 }}>
              {featuredAsset.type === "image" ? (
                <img src={featuredAsset.url} alt={featuredProject.name} className="w-full h-full object-cover" />
              ) : (
                <video src={featuredAsset.url} className="w-full h-full object-cover" muted autoPlay loop />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-7">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Featured project</p>
                <h2 className="text-2xl font-bold leading-tight text-white">{featuredProject.name}</h2>
                {featuredProject.description && (
                  <p className="text-white/60 mt-1 text-sm max-w-md line-clamp-2">{featuredProject.description}</p>
                )}
                <Link href={`/dashboard/projects/${featuredProject.id}`}>
                  <button className="mt-4 px-5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium backdrop-blur-sm transition-colors w-fit">
                    Open project
                  </button>
                </Link>
              </div>
              <button
                onClick={() => setHeroVisible(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1"
              >
                <X className="size-5" />
              </button>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {/* New project card */}
            <button
              onClick={() => setCreateOpen(true)}
              className="relative aspect-video rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors group"
            >
              <Plus className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
              <span className="absolute bottom-3 left-0 right-0 text-center text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">New project</span>
            </button>

            {/* Project cards */}
            {projects.map((project) => {
              const thumb = project.assets[0]
              return (
                <div key={project.id} className="group relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <Link href={`/dashboard/projects/${project.id}`} className="block w-full h-full">
                    {thumb ? (
                      thumb.type === "image" ? (
                        <img
                          src={thumb.url}
                          alt={project.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                      ) : (
                        <video src={thumb.url} className="w-full h-full object-cover" muted />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderOpen className="size-10 text-gray-300" />
                      </div>
                    )}
                    {/* Bottom gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {/* Date label */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <span className="text-white/80 text-xs font-medium">
                        {format(new Date(project.updatedAt), "MMM dd - HH:mm")}
                      </span>
                    </div>
                  </Link>

                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors">
                          <MoreVertical className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-sm">
                        <DropdownMenuItem
                          onClick={() => openEdit(project)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 size-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(project)}
                          className="text-red-500 focus:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="mr-2 size-3.5" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty state */}
          {projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="rounded-full bg-gray-100 p-6">
                <FolderOpen className="size-10 text-gray-300" />
              </div>
              <div>
                <p className="font-medium text-gray-600">Belum ada project</p>
                <p className="text-sm text-gray-400 mt-1">Klik "New project" untuk memulai</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input
              placeholder="Project name"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
            />
            <Textarea
              placeholder="Description (optional)"
              value={createDesc}
              onChange={e => setCreateDesc(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !createName.trim()}
              className="px-4 py-2 rounded-lg text-sm bg-black text-white font-medium hover:bg-black/80 transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {creating && <Loader2 className="size-3.5 animate-spin" />}
              Create
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input
              placeholder="Project name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={editing || !editName.trim()}
              className="px-4 py-2 rounded-lg text-sm bg-black text-white font-medium hover:bg-black/80 transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {editing && <Loader2 className="size-3.5 animate-spin" />}
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
