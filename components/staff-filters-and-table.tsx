"use client";

import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  created_at: string;
  role: string;
  profile_picture_url?: string;
}

interface Assessment {
  user_id: string;
  status: string;
}

interface Props {
  staffProfiles: StaffMember[];
  allAssessments: Assessment[];
}

export default function StaffFiltersAndTable({
  staffProfiles,
  allAssessments,
}: Props) {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [dateSort, setDateSort] = useState<"latest" | "earliest">("latest");

  const uniqueDepartments = useMemo(
    () =>
      Array.from(
        new Set(staffProfiles.map((staff) => staff.department).filter(Boolean))
      ).sort(),
    [staffProfiles]
  );

  const filteredAndSortedStaff = useMemo(() => {
    const filtered = staffProfiles.filter((staff) => {
      if (selectedDepartment === "all") return true;
      return staff.department === selectedDepartment;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateSort === "latest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [staffProfiles, selectedDepartment, dateSort]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-stretch sm:items-end">
        {/* Department Filter */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <label className="text-sm font-medium text-slate-700">
            Filter by Department
          </label>
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Sort Filter */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <label className="text-sm font-medium text-slate-700">
            Sort by Join Date
          </label>
          <Select
            value={dateSort}
            onValueChange={(value) =>
              setDateSort(value as "latest" | "earliest")
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">
                Latest Joined (Newest First)
              </SelectItem>
              <SelectItem value="earliest">
                Earliest Joined (Oldest First)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table - Horizontal scroll on mobile */}
      <div className="rounded-lg border border-slate-200 overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-900">
                Picture
              </th>
              <th className="text-left px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-900">
                Name
              </th>
              <th className="text-left px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-900">
                Email
              </th>
              <th className="text-left px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-900">
                Department
              </th>
              <th className="text-left px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-900">
                Topics
              </th>
              <th className="text-left px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-900">
                Joined
              </th>
              <th className="text-left px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredAndSortedStaff.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 sm:px-6 py-8 text-center text-slate-500 text-sm"
                >
                  {selectedDepartment !== "all"
                    ? `No staff members in ${selectedDepartment} department`
                    : "No staff members have registered yet"}
                </td>
              </tr>
            )}
            {filteredAndSortedStaff.map((staff) => {
              const staffAssessments =
                allAssessments.filter((a) => a.user_id === staff.id) || [];
              const completed = staffAssessments.filter(
                (a) => a.status === "completed"
              ).length;
              const initials =
                `${staff.first_name[0]}${staff.last_name[0]}`.toUpperCase();

              return (
                <tr
                  key={staff.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-3 sm:px-6 py-4">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                      <AvatarImage
                        src={staff.profile_picture_url || ""}
                        alt={`${staff.first_name} ${staff.last_name}`}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs sm:text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-900 whitespace-nowrap">
                    {staff.first_name} {staff.last_name}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-600">
                    {staff.email}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                    {staff.department}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                    {completed}/{staffAssessments.length} completed
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                    {new Date(staff.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <Link href={`/admin/staff/${staff.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-transparent text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
