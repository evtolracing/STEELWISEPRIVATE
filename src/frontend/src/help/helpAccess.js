/**
 * helpAccess.js — Role-based access helpers for in-app help.
 *
 * Filters modules based on the current user's role and division.
 */
import manualModules from './manualContent'

/**
 * Returns all modules accessible to the given role.
 * If no role is provided, returns all modules.
 */
export function getModulesForRole(role) {
  if (!role) return manualModules
  return manualModules.filter(
    (m) => !m.roles || m.roles.length === 0 || m.roles.includes(role),
  )
}

/**
 * Returns all modules that serve the given division.
 * If no division is provided, returns all modules.
 */
export function getModulesForDivision(division) {
  if (!division) return manualModules
  return manualModules.filter(
    (m) =>
      !m.divisions ||
      m.divisions.length === 0 ||
      m.divisions.includes(division),
  )
}

/**
 * Returns modules filtered by both role and division.
 */
export function getAccessibleModules({ role, division } = {}) {
  let modules = manualModules
  if (role) {
    modules = modules.filter(
      (m) => !m.roles || m.roles.length === 0 || m.roles.includes(role),
    )
  }
  if (division) {
    modules = modules.filter(
      (m) =>
        !m.divisions ||
        m.divisions.length === 0 ||
        m.divisions.includes(division),
    )
  }
  return modules
}

/**
 * Returns a single module by its moduleId.
 */
export function getModuleById(moduleId) {
  return manualModules.find((m) => m.moduleId === moduleId) || null
}

/**
 * Returns the module that matches a given route path.
 * Useful for contextual help — figures out which help module to show
 * based on the current page URL.
 */
export function getModuleForRoute(pathname) {
  if (!pathname) return null
  return (
    manualModules.find((m) =>
      m.routes.some((route) => pathname.startsWith(route)),
    ) || null
  )
}

/**
 * Full-text search across all module content.
 * Returns matching modules with the matching section ids.
 */
export function searchModules(query) {
  if (!query || query.trim().length < 2) return []
  const lower = query.toLowerCase().trim()

  return manualModules
    .map((mod) => {
      const titleMatch =
        mod.title.toLowerCase().includes(lower) ||
        mod.shortDescription.toLowerCase().includes(lower)

      const matchingSections = mod.sections.filter((section) => {
        if (section.title.toLowerCase().includes(lower)) return true
        return section.blocks.some((block) => {
          if (block.value && block.value.toLowerCase().includes(lower))
            return true
          if (block.items) {
            return block.items.some((item) => {
              if (typeof item === 'string')
                return item.toLowerCase().includes(lower)
              // troubleshoot items
              if (item.problem && item.problem.toLowerCase().includes(lower))
                return true
              if (item.solution && item.solution.toLowerCase().includes(lower))
                return true
              // field items
              if (item.name && item.name.toLowerCase().includes(lower))
                return true
              if (
                item.description &&
                item.description.toLowerCase().includes(lower)
              )
                return true
              return false
            })
          }
          if (block.dos) {
            if (block.dos.some((d) => d.toLowerCase().includes(lower)))
              return true
          }
          if (block.donts) {
            if (block.donts.some((d) => d.toLowerCase().includes(lower)))
              return true
          }
          if (block.rows) {
            return block.rows.some((row) =>
              row.some(
                (cell) =>
                  typeof cell === 'string' &&
                  cell.toLowerCase().includes(lower),
              ),
            )
          }
          return false
        })
      })

      if (titleMatch || matchingSections.length > 0) {
        return {
          ...mod,
          matchingSectionIds: matchingSections.map((s) => s.id),
          titleMatch,
        }
      }
      return null
    })
    .filter(Boolean)
}
