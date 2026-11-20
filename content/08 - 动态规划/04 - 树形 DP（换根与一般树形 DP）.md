# 无权树各点距离和（换根 DP）

要知道每个点到其余点的距离和，不必从每个点重新遍历。先任选一个根，从叶子往上算：`sz[v]` 是孩子 `v` 的子树大小，`down[v]` 是它到子树内各点的距离和。从父亲 `u` 去这些点都要多走一步，因此这一支贡献 `down[v]+sz[v]`。合并完就有了第一个根的答案。

现在把根从 `u` 挪到孩子 `v`。`v` 子树里的 `sz[v]` 个点都近了一步，剩下的 `n-sz[v]` 个点都远了一步，所以 `ans[v]=ans[u]+n-2*sz[v]`。这次从父亲往孩子算，一条边就能带出一个新答案。

`distanceSumFromEach(adj, root)`；adj 为非空连通无向树，每条边双向加入、边长为 1，点编号 0..n-1，root 合法。

O(n) 时间，O(n) 空间。

```cpp
// 返回 ans[u]=所有点到 u 的距离和；单点树返回 {0}
std::vector<i64> distanceSumFromEach(const std::vector<std::vector<int>> &adj, int root = 0) {
    int n = (int)adj.size();
    std::vector<int> fa(n, -1), sz(n, 1), order;
    std::vector<i64> down(n, 0), ans(n, 0);
    order.push_back(root);
    fa[root] = root;
    for (size_t i = 0; i < order.size(); i++) {
        int u = order[i];
        for (int v : adj[u]) {
            if (fa[v] != -1)
                continue;
            fa[v] = u;
            order.push_back(v);
        }
    }
    // 逆序合并子树大小与 down
    for (int i = n - 1; i >= 1; i--) {
        int u = order[i], p = fa[u];
        sz[p] += sz[u];
        down[p] += down[u] + sz[u];
    }
    // 换根：ans[u] = ans[p] + n - 2 * sz[u]
    ans[root] = down[root];
    for (size_t i = 1; i < order.size(); i++) {
        int u = order[i], p = fa[u];
        ans[u] = ans[p] + n - 2LL * sz[u];
    }
    return ans;
}
```
