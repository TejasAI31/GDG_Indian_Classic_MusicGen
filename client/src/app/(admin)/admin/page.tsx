import { clerkClient } from "@clerk/nextjs/server";
import { removeRole, setRole } from "./actions";
import Link from "next/link";
export default async function Admin() {
  const client = await clerkClient();

  const users = (await client.users.getUserList()).data;

  return (
    <>
      {users.map((user) => {
        return (
          <div
          key={user.id}
          className={`flex items-center justify-between gap-4 p-4 ${
            users.indexOf(user) % 2 === 0
            ? "bg-black"
            : "bg-black"
          }`}
        >
          <div className="flex gap-8">
            <div className="text-white">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-white">
              {
                user.emailAddresses.find(
                  (email) => email.id === user.primaryEmailAddressId
                )?.emailAddress
              }
            </div>
            <div className="text-white">
              {user.publicMetadata.role as string}
            </div>
          </div>
          <div className="flex gap-2">
            <form action={setRole} className="inline">
              <input type="hidden" value={user.id} name="id" />
              <input type="hidden" value="admin" name="role" />
              <button
                type="submit"
                className="px-2 py-1 text-sm border border-white text-white hover:bg-gray-800"
              >
                Make Admin
              </button>
            </form>
            <form action={removeRole} className="inline">
              <input type="hidden" value={user.id} name="id" />
              <button
                type="submit"
                className="px-2 py-1 text-sm border border-white text-white hover:bg-gray-800"
              >
                Remove Role
              </button>
            </form>
          </div>
        </div>
        );
      })}
      <Link href="/explore_edit">
      <div className="text-white text-center flex justify-center h-[40rem] items-center cursor-pointer"> Go to explore edits </div></Link>
    </>
  );
}
